'use client';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="heading-responsive font-bold text-primary-700">
          Privacy Policy
        </h1>
        <p className="text-secondary-600 mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 border border-secondary-200 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            1. Introduction
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            Welcome to Dental Tutor ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our dental practice management platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            2. Information We Collect
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                2.1 Personal Information
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                We collect personal information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-secondary-700 ml-4">
                <li>Name, email address, phone number, and mailing address</li>
                <li>Date of birth and gender</li>
                <li>Insurance information</li>
                <li>Medical history and dental records</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
                <li>Appointment history and preferences</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                2.2 Automatically Collected Information
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                When you use our platform, we automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-secondary-700 ml-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, features used)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            3. How We Use Your Information
          </h2>
          <p className="text-secondary-700 leading-relaxed mb-2">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-secondary-700 ml-4">
            <li>Provide, maintain, and improve our dental services</li>
            <li>Process appointments and manage your dental care</li>
            <li>Communicate with you about appointments, treatments, and services</li>
            <li>Process payments and send invoices</li>
            <li>Send appointment reminders and notifications</li>
            <li>Comply with legal obligations and healthcare regulations</li>
            <li>Protect against fraud and unauthorized access</li>
            <li>Analyze usage patterns to improve user experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            4. Information Sharing and Disclosure
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                4.1 Healthcare Providers
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                We may share your health information with licensed dental professionals and specialists involved in your care, as necessary for treatment purposes.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                4.2 Service Providers
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                We may share information with third-party service providers who perform services on our behalf, such as payment processing, email delivery, and data analytics. These providers are contractually obligated to protect your information.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                4.3 Legal Requirements
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                We may disclose your information if required by law, court order, or government regulation, or to protect our rights, property, or safety.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-600 mb-2">
                4.4 Business Transfers
              </h3>
              <p className="text-secondary-700 leading-relaxed">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            5. Health Information Privacy (HIPAA)
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            As a healthcare provider, we are subject to the Health Insurance Portability and Accountability Act (HIPAA). We maintain strict safeguards to protect your Protected Health Information (PHI) and will only use or disclose it as permitted by HIPAA and as described in our Notice of Privacy Practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            6. Data Security
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            We implement industry-standard security measures to protect your information, including:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-secondary-700 ml-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication and access controls</li>
            <li>Regular security audits and assessments</li>
            <li>Employee training on data protection</li>
            <li>Compliance with healthcare data security standards</li>
          </ul>
          <p className="text-secondary-700 leading-relaxed mt-4">
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            7. Your Rights and Choices
          </h2>
          <p className="text-secondary-700 leading-relaxed mb-2">
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-secondary-700 ml-4">
            <li>Access and receive a copy of your health information</li>
            <li>Request corrections to inaccurate or incomplete information</li>
            <li>Request restrictions on how we use or disclose your information</li>
            <li>Request confidential communications</li>
            <li>File a complaint if you believe your privacy rights have been violated</li>
            <li>Opt-out of certain marketing communications</li>
            <li>Delete your account and associated data (subject to legal retention requirements)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            8. Cookies and Tracking Technologies
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            We use cookies and similar technologies to enhance your experience, analyze usage patterns, and personalize content. You can control cookies through your browser settings, but disabling cookies may limit certain features of our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            9. Children's Privacy
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            10. Data Retention
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            We retain your information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. Health records are retained in accordance with applicable healthcare regulations and state laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            11. International Data Transfers
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            12. Changes to This Privacy Policy
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-700 mb-4">
            13. Contact Us
          </h2>
          <p className="text-secondary-700 leading-relaxed">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
            <p className="text-secondary-700">
              <strong>Dental Tutor</strong><br />
              Email: privacy@dentaltutor.com<br />
              Phone: (555) 123-4567<br />
              Address: 123 Dental Street, City, State 12345
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

