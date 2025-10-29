import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Privacy Policy - Rizzify',
  description: 'Rizzify Privacy Policy - Learn how we protect your data and privacy',
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-950">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none text-light/80">
            <p className="text-sm text-light/60 mb-8">Last updated: October 2024</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p>
                Rizzify ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-4">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (email, name, password)</li>
                <li>Photos you upload for processing</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Communication with our support team</li>
                <li>Feedback and survey responses</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-4">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device information (browser type, IP address, operating system)</li>
                <li>Usage data (pages visited, time spent, clicks)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Location data (if permitted)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your transactions and send related information</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Respond to your inquiries and customer support requests</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Detect and prevent fraudulent transactions</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Photo Processing and Storage</h2>
              <p>
                Your uploaded photos are processed to generate AI-powered dating photos. We:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Store your photos securely on our servers</li>
                <li>Use them only for the purpose of generating your requested photos</li>
                <li>Do not share your photos with third parties without consent</li>
                <li>Allow you to delete your photos at any time</li>
                <li>Automatically delete photos after a specified period (see Terms of Service)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Service providers who assist in our operations (payment processors, hosting providers)</li>
                <li>Law enforcement if required by law</li>
                <li>Other parties with your explicit consent</li>
              </ul>
              <p className="mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability (receive your data in a portable format)</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at privacy@rizzify.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your experience. You can control cookie settings through your browser preferences. Disabling cookies may affect some features of our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Third-Party Links</h2>
              <p>
                Our website may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing any information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">10. NSFW Content Policy</h2>
              <p>
                Rizzify does not accept or process NSFW (Not Safe For Work) content. Our AI models are configured to automatically reject inappropriate content, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nudity or sexually explicit content</li>
                <li>Violence or graphic imagery</li>
                <li>Hate speech or discriminatory content</li>
                <li>Any content that violates our Terms of Service</li>
              </ul>
              <p className="mt-4">
                <strong>Automated Detection:</strong> Our AI models include built-in safety filters that automatically detect and reject NSFW content during the upload and processing stages.
              </p>
              <p className="mt-4">
                <strong>Consequences:</strong> If you attempt to upload NSFW content:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your upload will be automatically rejected</li>
                <li>No refund will be provided for rejected content</li>
                <li>Repeated violations may result in account suspension or termination</li>
                <li>We reserve the right to report illegal content to authorities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Children's Privacy</h2>
              <p>
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we become aware of such collection, we will delete it immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">12. International Data Transfers</h2>
              <p>
                Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws that differ from your home country. By using our services, you consent to such transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <p>Email: le13107621169@gmail.com</p>
                <p className="mt-2">Location: Nanjing, China</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
