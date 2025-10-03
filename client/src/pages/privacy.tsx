// src/pages/privacy.tsx
import React from "react";
import { useLocation } from "wouter";

export default function Privacy() {
  const [, setLocation] = useLocation();

  const handleBackClick = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-[#50C8E5]/10 to-[#125566]/10">
      {/* Header with Title and Back Button */}
      <div className="flex justify-between items-center mb-8 pt-4 px-[15%]">
        {/* <button
          onClick={handleBackClick}
          className="text-[#50C8E5] underline hover:text-[#125566] transition-colors duration-200 font-medium"
        >
          Back
        </button> */}
        <h1 className="text-3xl font-bold text-[#125566] flex-1 text-center">Privacy Policy</h1>
        <div className="w-10" /> {/* Spacer for symmetry */}
      </div>

      <div className="flex-1 overflow-y-auto px-[10%] pb-16">
        {/* <p className="text-gray-600 mb-8 text-center">
          Before creating an account, please read and accept our terms and policies.
        </p> */}

        <section className="space-y-6 mb-8">
          <h2 className="text-xl font-bold text-[#125566]">Terms & Conditions & Disclaimer</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#125566]">Purpose of the App</h3>
            <p className="text-gray-700">
              This mobile application is developed for academic research on the psychological well-being of women undergoing fertility treatment in India. The app provides guidance for stress reduction, emotional support, and overall mental wellness. It is non-commercial and used only for study purposes.
            </p>

            <h3 className="text-lg font-semibold text-[#125566]">Non-Commercial Use</h3>
            <p className="text-gray-700">
              This app does not sell products, charge fees, or provide any financial benefits. All features are intended solely for research and educational purposes.
            </p>
          </div>
        </section>

        <section className="space-y-6 mb-8">
          <h2 className="text-xl font-bold text-[#125566]">Data Privacy & Confidentiality</h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              All information you share will be kept strictly confidential and secure.
            </p>
            <p className="text-gray-700">
              Your data will be anonymized and will not be shared with any third party, individual, or organization.
            </p>
            <p className="text-gray-700">
              We comply with applicable Indian laws, including the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
            </p>
            <p className="text-gray-700">
              We also follow the principles of the Digital Personal Data Protection Act, 2023 regarding informed consent, data rights, and security.
            </p>
          </div>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-[#125566]">Consent</h2>
          <p className="text-gray-700">
            By using this app, you provide your free, informed, and voluntary consent for your anonymized data to be used in academic research. You may withdraw your consent at any time without penalty.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-[#125566]">No External Association</h2>
          <p className="text-gray-700">
            This app is not affiliated with any commercial entity, hospital, or external organization.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-[#125566]">Voluntary Participation</h2>
          <p className="text-gray-700">
            Your participation is voluntary. You may stop using the app or skip any section without any negative consequences.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-[#125566]">Legal Compliance</h2>
          <p className="text-gray-700">
            We follow all applicable Indian privacy and data protection laws. In case of a data breach, we will take immediate steps as per legal requirements.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#125566]">Contact</h2>
          <p className="text-gray-700">
            If you have any questions, concerns, or wish to withdraw your consent, please contact us at:
          </p>
          <p className="text-[#50C8E5] font-medium">contact@fertiliwell.in</p>
        </section>
      </div>
    </div>
  );
}