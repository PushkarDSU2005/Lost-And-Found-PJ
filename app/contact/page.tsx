import type { Metadata } from 'next'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Lost & Found team.',
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28 md:pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Contact Us</h1>
        <p className="mt-2 text-muted-foreground">
          Have questions or need help? We're here to assist you.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5 text-primary" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">
              For general inquiries or support
            </p>
            <a
              href="mailto:support@campusfind.edu"
              className="text-primary hover:underline"
            >
              support@campusfind.edu
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="size-5 text-primary" />
              Phone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">
              Campus Security (24/7)
            </p>
            <a href="tel:+15555551234" className="text-primary hover:underline">
              (555) 555-1234
            </a>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              Visit Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">
              Main Lost & Found Office
            </p>
            <address className="not-italic">
              Student Services Building, Room 105
              <br />
              Monday–Friday, 9:00 AM – 5:00 PM
            </address>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Found Something Not Listed?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If you found an item on campus, please:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Submit a "Found" report through the system</li>
            <li>Or drop it off at any designated drop point</li>
            <li>Items containing ID or sensitive documents should be turned in to Campus Security immediately</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
