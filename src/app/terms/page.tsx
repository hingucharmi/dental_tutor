'use client';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="heading-responsive font-bold text-primary-700">
          Terms of Service
        </h1>
        <p className="text-secondary-600 mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 border border-secondary-200 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            By accessing and using Dental Tutor ("the Platform," "we," "our," or "us"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our Platform. These Terms apply to all users, including patients, visitors, and healthcare providers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            2. Description of Service
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            Dental Tutor is a dental practice management platform that provides:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-secondary-700 ml-4">
            <li>Appointment scheduling and management</li>
            <li>Patient portal and health records access</li>
            <li>Communication tools with dental professionals</li>
            <li>Payment processing and billing services</li>
            <li>Educational resources and dental care information</li>
            <li>AI-powered chatbot for dental inquiries</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            3. User Accounts and Registration
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                3.1 Account Creation
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                3.2 Account Security
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                3.3 Account Termination
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason we deem necessary to protect our Platform and users.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            4. Medical Disclaimer
          </h2>
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-secondary-700 leading-relaxed font-semibold mb-2">
              IMPORTANT MEDICAL DISCLAIMER:
            </p>
            <p className="text-secondary-700 leading-relaxed">
              The Platform is not a substitute for professional dental or medical advice, diagnosis, or treatment. The information provided on the Platform, including AI-generated responses, is for informational purposes only and should not be used as a substitute for professional dental care. Always seek the advice of qualified dental professionals regarding any dental condition or treatment.
            </p>
            <p className="text-secondary-700 leading-relaxed mt-2">
              In case of a dental emergency, contact your dentist immediately or call emergency services.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            5. Appointments and Services
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                5.1 Appointment Scheduling
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                You may schedule appointments through the Platform. We reserve the right to cancel or reschedule appointments due to unforeseen circumstances. You agree to provide accurate information when scheduling appointments.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                5.2 Cancellation Policy
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                You must cancel appointments at least 24 hours in advance. Failure to cancel within this timeframe or no-shows may result in cancellation fees as determined by your dental practice.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                5.3 Service Availability
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                We do not guarantee the availability of specific services, appointments, or healthcare providers. Services are subject to availability and the discretion of participating dental practices.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            6. Payment Terms
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                6.1 Payment Processing
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                Payments for services are processed through secure third-party payment processors. You agree to provide valid payment information and authorize us to charge your payment method for services rendered.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                6.2 Fees and Charges
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                You are responsible for all fees and charges associated with services provided through the Platform. Fees are determined by your dental practice and may vary. We are not responsible for pricing disputes between you and your dental practice.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                6.3 Refunds
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                Refund policies are determined by individual dental practices. We facilitate refund requests but are not responsible for refund decisions made by dental practices.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            7. User Conduct
          </h2>
          <p className="text-secondary-700 leading-relaxed mb-2">
            You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-secondary-700 ml-4">
            <li>Use the Platform for any illegal or unauthorized purpose</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Transmit any harmful code, viruses, or malware</li>
            <li>Attempt to gain unauthorized access to the Platform or other users' accounts</li>
            <li>Impersonate any person or entity</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Interfere with or disrupt the Platform's operation</li>
            <li>Use automated systems to access the Platform without authorization</li>
            <li>Share false or misleading information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            8. Intellectual Property
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            The Platform and its content, including but not limited to text, graphics, logos, images, software, and AI technology, are owned by Dental Tutor or its licensors and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written permission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            9. User Content
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                9.1 Content Ownership
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                You retain ownership of content you submit to the Platform, including messages, images, and health information. By submitting content, you grant us a license to use, store, and process such content as necessary to provide our services.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                9.2 Content Responsibility
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                You are solely responsible for the content you submit. You represent and warrant that you have the right to submit such content and that it does not violate any third-party rights or applicable laws.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            10. Privacy and Health Information
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. We handle health information in accordance with HIPAA and other applicable healthcare privacy laws. Please review our Privacy Policy to understand how we collect, use, and protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            11. Limitation of Liability
          </h2>
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-secondary-700 leading-relaxed mb-2">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc list-inside space-y-1 text-secondary-700 ml-4">
              <li>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND</li>
              <li>WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
              <li>WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
              <li>WE ARE NOT LIABLE FOR ANY DENTAL OR MEDICAL OUTCOMES RESULTING FROM USE OF THE PLATFORM</li>
              <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE PAST 12 MONTHS</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            12. Indemnification
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            You agree to indemnify, defend, and hold harmless Dental Tutor, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Platform, violation of these Terms, or infringement of any rights of another party.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            13. Third-Party Services and Links
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            The Platform may contain links to third-party websites or integrate with third-party services. We are not responsible for the content, privacy practices, or terms of service of third-party sites or services. Your use of third-party services is at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            14. Modifications to Terms
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Platform after changes become effective constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            15. Termination
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            We may terminate or suspend your access to the Platform immediately, without prior notice, for any reason, including violation of these Terms. Upon termination, your right to use the Platform will cease immediately, but provisions that by their nature should survive will remain in effect.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            16. Governing Law and Dispute Resolution
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of [Your State/Country], without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration in accordance with the rules of [Arbitration Organization], except where prohibited by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            17. Severability
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            18. Entire Agreement
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and Dental Tutor regarding your use of the Platform and supersede all prior agreements and understandings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            19. Contact Information
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
            <p className="text-secondary-700">
              <strong>Dental Tutor</strong><br />
              Email: legal@dentaltutor.com<br />
              Phone: (555) 123-4567<br />
              Address: 123 Dental Street, City, State 12345
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

