/**
 * Safe Action Wrapper
 * 
 * Wraps all server actions to provide consistent error handling:
 * - Never exposes raw errors/stack traces to client
 * - Returns structured {ok, data} or {ok: false, code, message}
 * - Logs errors server-side with request ID
 * - Friendly error messages for users
 */

import { headers } from 'next/headers'

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; code: string; message: string }

type ActionFunction<TInput, TOutput> = (input: TInput) => Promise<TOutput>

/**
 * Generates a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Maps error codes to user-friendly messages
 */
function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    UNAUTHENTICATED: 'You must be signed in to do that.',
    UNAUTHORIZED: 'You don\'t have permission to do that.',
    NOT_FOUND: 'The item you\'re looking for doesn\'t exist.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    RATE_LIMITED: 'You\'re doing that too often. Please wait a moment.',
    IP_RATE_LIMITED: 'Too many requests from your network. Please try again later.',
    BANNED: 'Your account has been suspended.',
    DB_ERROR: 'Something went wrong. Please try again.',
    NETWORK_ERROR: 'Connection failed. Check your internet and try again.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  }
  
  return messages[code] || messages.UNKNOWN_ERROR
}

/**
 * Wraps a server action with error handling
 * 
 * @example
 * export const deleteItem = safeAction(async (itemId: string) => {
 *   // Your logic here
 *   return { itemId, deletedAt: new Date() }
 * })
 */
export function safeAction<TInput, TOutput>(
  action: ActionFunction<TInput, TOutput>,
  options?: {
    actionName?: string
    logErrors?: boolean
  }
): (input: TInput) => Promise<ActionResult<TOutput>> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const requestId = generateRequestId()
    const actionName = options?.actionName || action.name || 'anonymous'
    const shouldLog = options?.logErrors ?? true
    
    try {
      // Get headers for logging (IP, user agent)
      const headersList = await headers()
      const userAgent = headersList.get('user-agent') || 'unknown'
      const ip = headersList.get('x-forwarded-for') || 
                 headersList.get('x-real-ip') || 
                 'unknown'
      
      if (shouldLog) {
        console.log(`[${requestId}] ${actionName} started`, {
          ip,
          userAgent: userAgent.substring(0, 50),
          timestamp: new Date().toISOString(),
        })
      }
      
      const result = await action(input)
      
      if (shouldLog) {
        console.log(`[${requestId}] ${actionName} succeeded`)
      }
      
      return { ok: true, data: result }
      
    } catch (error) {
      // Determine error code
      let code = 'UNKNOWN_ERROR'
      let message = 'An unexpected error occurred'
      
      if (error instanceof Error) {
        // Check for known error patterns
        if (error.message.includes('PGRST301')) {
          code = 'NOT_FOUND'
        } else if (error.message.includes('PGRST116')) {
          code = 'UNAUTHENTICATED'
        } else if (error.message.includes('PGRST204')) {
          code = 'UNAUTHORIZED'
        } else if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
          code = 'NETWORK_ERROR'
        } else if (error.message.toLowerCase().includes('rate limit')) {
          code = 'RATE_LIMITED'
        }
        
        message = error.message
      }
      
      // Log error server-side (never expose to client)
      if (shouldLog) {
        console.error(`[${requestId}] ${actionName} failed`, {
          code,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          } : String(error),
          timestamp: new Date().toISOString(),
        })
      }
      
      // Return user-friendly error
      return {
        ok: false,
        code,
        message: getErrorMessage(code),
      }
    }
  }
}

/**
 * Utility to check if an action result is successful
 * 
 * @example
 * const result = await deleteItem(id)
 * if (isSuccess(result)) {
 *   console.log('Deleted at:', result.data.deletedAt)
 * } else {
 *   console.error(result.message)
 * }
 */
export function isSuccess<T>(result: ActionResult<T>): result is { ok: true; data: T } {
  return result.ok === true
}

/**
 * Utility to check if an action result is an error
 */
export function isError<T>(result: ActionResult<T>): result is { ok: false; code: string; message: string } {
  return result.ok === false
}
