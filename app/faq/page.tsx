import type { Metadata } from 'next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common questions about using the campus lost and found system',
};

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-28 md:pb-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about the campus lost and found system
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {/* Getting Started */}
          <AccordionItem value="item-1" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              How do I report a lost item?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">
                Click "Report Lost" from the navigation menu or homepage. Fill out the form with:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Item description and category</li>
                <li>Where and when you lost it</li>
                <li>Photos (optional but recommended)</li>
                <li>Your contact preferences</li>
              </ul>
              <p className="mt-3">
                Your listing will be visible to finders, and you'll receive notifications if someone
                reports finding a match.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              How do I report a found item?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">
                Click "Report Found" and provide details about the item. You can either:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <span className="font-medium">Hold the item</span> — Wait for the owner to claim it
                  through the platform
                </li>
                <li>
                  <span className="font-medium">Drop it off</span> — Take it to an{' '}
                  <Link href="/drop-points" className="text-primary hover:underline">
                    official drop-off point
                  </Link>
                </li>
              </ul>
              <p className="mt-3">
                The system will suggest potential matches to help reunite items with owners quickly.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Claims & Verification */}
          <AccordionItem value="item-3" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              How does the claim process work?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">When you find your lost item listed:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Click "Claim This Item" on the listing</li>
                <li>Describe the item in detail to prove ownership</li>
                <li>Optionally upload proof (receipt, serial number, photo)</li>
                <li>The finder or an admin reviews your claim</li>
                <li>If approved, coordinate pickup via messaging</li>
              </ol>
              <p className="mt-3">
                For high-value items at drop-off points, admin approval is required for extra
                security.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              What proof of ownership do I need?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">Helpful proof includes:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Serial numbers or IMEI (for electronics)</li>
                <li>Purchase receipts showing the item and your name</li>
                <li>Photos showing you with the item before losing it</li>
                <li>Detailed description of unique marks, damage, or contents</li>
                <li>For wallets/IDs: matching government ID</li>
              </ul>
              <p className="mt-3">
                The more specific you can be, the faster your claim will be approved.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Safety & Privacy */}
          <AccordionItem value="item-5" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              Is it safe to meet someone to exchange an item?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">
                Yes, if you follow our{' '}
                <Link href="/safety" className="text-primary hover:underline">
                  safety guidelines
                </Link>
                :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Meet in public, well-lit campus areas during daytime</li>
                <li>Bring a friend if possible</li>
                <li>Use platform messaging until you verify the person</li>
                <li>For high-value items, consider using a drop-off point</li>
              </ul>
              <p className="mt-3">
                Trust your instincts. If something feels wrong, report it and walk away.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              What information is shared publicly?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">
                We prioritize privacy. Only the following is visible on listings:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Item description and photos</li>
                <li>General location (building/area, not exact coordinates)</li>
                <li>Date reported</li>
                <li>Your display name (not your email or phone)</li>
              </ul>
              <p className="mt-3">
                Contact details are never shared. All communication happens through our secure
                messaging system. Read our full{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Account & Technical */}
          <AccordionItem value="item-7" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              Do I need an account to use this service?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">
                You can browse listings without an account, but you need to sign in to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Report lost or found items</li>
                <li>Claim items</li>
                <li>Send and receive messages</li>
                <li>Track your posts and claims</li>
              </ul>
              <p className="mt-3">
                Sign-in is quick and secure using your campus email or Google account.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              How long are items kept in the system?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <span className="font-medium">Active listings:</span> 90 days from the date posted
                </li>
                <li>
                  <span className="font-medium">Drop-off point items:</span> 30-90 days depending on
                  item type and space
                </li>
                <li>
                  <span className="font-medium">Expired listings:</span> Archived but can be
                  reactivated if needed
                </li>
              </ul>
              <p className="mt-3">
                Unclaimed items at physical drop-off points are typically donated to charity or
                recycled after the holding period.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              Can I delete my listing or account?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">Yes, absolutely:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <span className="font-medium">Delete a listing:</span> Go to your dashboard, find
                  the item, and click "Delete"
                </li>
                <li>
                  <span className="font-medium">Delete your account:</span> Contact support or visit
                  account settings
                </li>
              </ul>
              <p className="mt-3">
                All your data (posts, messages, images) will be permanently removed within 30 days.
                See our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{' '}
                for details.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Items & Categories */}
          <AccordionItem value="item-10" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              What types of items can I report?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">Most personal items are allowed:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Electronics (phones, laptops, headphones, chargers)</li>
                <li>Personal accessories (keys, wallets, bags, jewelry)</li>
                <li>Clothing and shoes</li>
                <li>Books, notebooks, and stationery</li>
                <li>Sports and fitness gear</li>
                <li>ID cards and documents</li>
              </ul>
              <p className="mt-3 font-medium">Not allowed:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Weapons, illegal substances, or contraband</li>
                <li>Perishable food or beverages</li>
                <li>Live animals (contact campus animal services instead)</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-11" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              What if I can't find my item listed?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">Try these steps:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  <span className="font-medium">Search with different keywords</span> — Try synonyms
                  or the brand name
                </li>
                <li>
                  <span className="font-medium">Check all categories</span> — Someone may have
                  categorized it differently
                </li>
                <li>
                  <span className="font-medium">Report it as lost</span> — You'll be notified if it's
                  found later
                </li>
                <li>
                  <span className="font-medium">Visit drop-off points</span> — Not all found items
                  are listed online immediately
                </li>
                <li>
                  <span className="font-medium">Check back regularly</span> — New items are added
                  daily
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* Rewards & Etiquette */}
          <AccordionItem value="item-12" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              Can I offer a reward for my lost item?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-2">
                While you can mention a reward in your listing, we encourage doing the right thing
                for its own sake. Campus community members should help each other without expecting
                payment.
              </p>
              <p className="mt-3">
                <span className="font-medium">Tip:</span> A genuine thank you, positive feedback, or
                small token of appreciation (coffee, snack) is often more meaningful than cash.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-13" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              What if someone falsely claims my found item?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">You're in control as the finder:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Review all claims carefully before approving</li>
                <li>Ask for proof of ownership (serial number, photos, detailed description)</li>
                <li>Reject claims that seem suspicious or lack verification</li>
                <li>Report fraudulent claims to admins</li>
                <li>For valuable items, consider requiring admin approval before handover</li>
              </ul>
              <p className="mt-3">
                Trust your instincts. If multiple people claim the same item, the person with the
                best proof wins.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Still Have Questions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Still have questions?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Can't find what you're looking for? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/safety"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Safety Guidelines
              </Link>
              <Link
                href="/drop-points"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Drop-off Points
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
