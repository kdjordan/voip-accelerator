<template>
  <div class="min-h-screen bg-canvas text-fg">
    <!-- Editorial masthead -->
    <header class="border-b border-line">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-5">
        <RouterLink to="/" class="inline-flex">
          <VoipLogo />
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <p class="eyebrow text-accent mb-3">Legal · Terms</p>
      <h1 class="font-display text-4xl md:text-5xl font-semibold tracking-tight text-fg">
        Terms and Conditions
      </h1>
      <div class="slab-rule mt-6 mb-10"></div>

      <div class="prose prose-lg max-w-none">
        <p class="text-fg-faint italic">Last Updated: May 25, 2026</p>

        <p>
          Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before
          using the VOIP Accelerator website and service (the "Service") operated by VOIP Accelerator ("us", "we", or "our").
        </p>

        <p>
          Your access to and use of the Service is conditioned upon your acceptance of and
          compliance with these Terms. These Terms apply to all visitors, users, and others who wish
          to access or use the Service. By accessing or using the Service you agree to be bound by
          these Terms. If you disagree with any part of the terms then you do not have permission to
          access the Service.
        </p>

        <h2 class="text-fg font-display">1. Description of Service</h2>
        <p>
          VOIP Accelerator provides tools for analyzing, comparing, and managing Voice over IP
          (VOIP) rate decks and related telecommunications data. The Service allows users to upload
          data, perform comparisons, leverage LERG lookups, and export reports, primarily operating
          within the user's browser for enhanced data privacy.
        </p>

        <h2 class="text-fg font-display">2. Accounts</h2>
        <p>
          When you create an account with us, you guarantee that the information you provide us is
          accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete
          information may result in the immediate termination of your account on the Service.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your account and password,
          including but not limited to the restriction of access to your computer and/or account.
          You agree to accept responsibility for any and all activities or actions that occur under
          your account and/or password. You must notify us immediately upon becoming aware of any
          breach of security or unauthorized use of your account.
        </p>

        <h2 class="text-fg font-display">3. Fees</h2>
        <p>
          The Service is provided free of charge. There are no subscriptions, fees, or payments of
          any kind, and we do not collect or process any payment or credit card information.
        </p>

        <h2 class="text-fg font-display">4. Data Privacy and Security</h2>
        <p>
          VOIP Accelerator is designed with user privacy in mind. Most data processing, including
          rate deck analysis and comparisons, occurs locally within your browser using IndexedDB.
          Uploaded files and derived data are generally not transmitted to our servers, except where
          necessary for specific features explicitly indicated (e.g., account management). Account
          information, such as your email address, is stored securely on our own servers. Please
          refer to our Privacy Policy for more details on how we handle your data.
        </p>
        <div class="my-4 not-prose">
          <RouterLink
            to="/privacy-policy"
            class="inline-flex items-center border border-line-strong bg-row px-4 py-2 font-display text-[11px] font-medium uppercase tracking-[0.06em] text-fg transition-colors hover:border-accent hover:text-accent"
          >
            View Privacy Policy
          </RouterLink>
        </div>
        <p>
          While we strive to use commercially acceptable means to protect your data processed
          locally, remember that no method of transmission over the Internet or method of electronic
          storage is 100% secure. You are responsible for maintaining the security of your own
          device and browser environment.
        </p>

        <h2 class="text-fg font-display">5. Intellectual Property</h2>
        <p>
          The Service and its original content (excluding Content provided by users), features and
          functionality are and will remain the exclusive property of VOIP Accelerator and its
          licensors. The Service is protected by copyright, trademark, and other laws of both the
          United States and foreign countries. Our trademarks and trade dress may not be used in
          connection with any product or service without the prior written consent of VOIP
          Accelerator.
        </p>
        <p>
          You retain all ownership rights to the data you upload ("User Content"). We claim no
          ownership over your content and only process it locally within your browser or as required
          to provide the Service.
        </p>

        <h2 class="text-fg font-display">6. User Conduct</h2>
        <p>You agree not to use the Service:</p>
        <ul>
          <li>
            In any way that violates any applicable national or international law or regulation.
          </li>
          <li>
            For the purpose of exploiting, harming, or attempting to exploit or harm minors in any
            way.
          </li>
          <li>
            To transmit, or procure the sending of, any advertising or promotional material,
            including any "junk mail", "chain letter," "spam," or any other similar solicitation.
          </li>
          <li>
            To impersonate or attempt to impersonate VOIP Accelerator, a VOIP Accelerator employee,
            another user, or any other person or entity.
          </li>
          <li>
            In any way that infringes upon the rights of others, or in any way is illegal,
            threatening, fraudulent, or harmful, or in connection with any unlawful, illegal,
            fraudulent, or harmful purpose or activity.
          </li>
          <li>
            To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of
            the Service, or which, as determined by us, may harm or offend VOIP Accelerator or users
            of the Service or expose them to liability.
          </li>
        </ul>

        <h2 class="text-fg font-display">7. Disclaimers</h2>
        <p>
          Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and
          "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether
          express or implied, including, but not limited to, implied warranties of merchantability,
          fitness for a particular purpose, non-infringement, or course of performance.
        </p>
        <p>
          VOIP Accelerator, its subsidiaries, affiliates, and its licensors do not warrant that a)
          the Service will function uninterrupted, secure or available at any particular time or
          location; b) any errors or defects will be corrected; c) the Service is free of viruses or
          other harmful components; or d) the results of using the Service will meet your
          requirements.
        </p>
        <p>
          The accuracy of LERG data and rate comparisons depends on the data provided by you and the
          underlying LERG database. We do not guarantee the absolute accuracy of all insights
          derived from the data.
        </p>

        <h2 class="text-fg font-display">8. Limitation of Liability</h2>
        <p>
          In no event shall VOIP Accelerator, nor its directors, employees, partners, agents,
          suppliers, or affiliates, be liable for any indirect, incidental, special, consequential
          or punitive damages, including without limitation, loss of profits, data, use, goodwill,
          or other intangible losses, resulting from (i) your access to or use of or inability to
          access or use the Service; (ii) any conduct or content of any third party on the Service;
          (iii) any content obtained from the Service; and (iv) unauthorized access, use or
          alteration of your transmissions or content, whether based on warranty, contract, tort
          (including negligence) or any other legal theory, whether or not we have been informed of
          the possibility of such damage, and even if a remedy set forth herein is found to have
          failed of its essential purpose. Some jurisdictions do not allow limitations of liability
          for consequential or incidental damages, so the above limitation may not apply to you.
        </p>

        <h2 class="text-fg font-display">9. Indemnification</h2>
        <p>
          You agree to defend, indemnify and hold harmless VOIP Accelerator and its licensee and
          licensors, and their employees, contractors, agents, officers and directors, from and
          against any and all claims, damages, obligations, losses, liabilities, costs or debt, and
          expenses (including but not limited to attorney's fees), resulting from or arising out of
          a) your use and access of the Service, by you or any person using your account and
          password; b) a breach of these Terms, or c) Content posted on the Service.
        </p>

        <h2 class="text-fg font-display">10. Termination</h2>
        <p>
          We may terminate or suspend your account and bar access to the Service immediately,
          without prior notice or liability, under our sole discretion, for any reason whatsoever
          and without limitation, including but not limited to a breach of the Terms.
        </p>
        <p>
          If you wish to terminate your account, you may simply discontinue using the Service or
          contact us to delete your account data.
        </p>
        <p>
          All provisions of the Terms which by their nature should survive termination shall survive
          termination, including, without limitation, ownership provisions, warranty disclaimers,
          indemnity and limitations of liability.
        </p>

        <h2 class="text-fg font-display">11. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of United States,
          without regard to its conflict of law provisions.
        </p>
        <p>
          Our failure to enforce any right or provision of these Terms will not be considered a
          waiver of those rights. If any provision of these Terms is held to be invalid or
          unenforceable by a court, the remaining provisions of these Terms will remain in effect.
          These Terms constitute the entire agreement between us regarding our Service, and
          supersede and replace any prior agreements we might have had between us regarding the
          Service.
        </p>

        <h2 class="text-fg font-display">12. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any
          time. If a revision is material we will provide at least 30 days notice prior to any new
          terms taking effect. What constitutes a material change will be determined at our sole
          discretion.
        </p>
        <p>
          By continuing to access or use our Service after any revisions become effective, you agree
          to be bound by the revised terms. If you do not agree to the new terms, you are no longer
          authorized to use the Service. We encourage you to review the Terms periodically. Your
          continued use of the Service after changes are posted constitutes acceptance of those
          changes.
        </p>

        <h2 class="text-fg font-display">13. Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us:</p>
        <ul>
          <li>By email: support@voipaccelerator.com</li>
        </ul>
      </div>
    </main>
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
  import VoipLogo from '@/components/shared/VoipLogo.vue';
  import TheFooter from '@/components/shared/TheFooter.vue';

  // No specific script logic needed for this static page yet
</script>

<style scoped>
  .prose h2 {
    @apply mb-4 mt-10 pb-2 border-b border-line text-xl tracking-tight;
  }

  .prose p,
  .prose ul,
  .prose li {
    @apply font-sans text-fg-dim leading-relaxed;
  }

  .prose strong {
    @apply text-fg;
  }

  .prose a {
    @apply text-accent hover:text-accent-text;
  }

  .prose ul {
    @apply list-disc pl-6;
  }
</style>
