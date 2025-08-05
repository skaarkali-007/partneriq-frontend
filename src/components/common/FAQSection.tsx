import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  cta?: {
    text: string;
    link: string;
    type: 'primary' | 'secondary';
  };
}

interface FAQSectionProps {
  className?: string;
}

const faqData: FAQItem[] = [
  {
    id: 'commission-structure',
    question: 'How does the commission structure work?',
    answer: 'Our commission structure is designed to reward high-performing partners. You earn competitive rates based on the products you promote and your performance tier. Commission rates range from 15% to 45% depending on the product category and your monthly volume. We offer both percentage-based and flat-rate commissions, with bonuses for top performers.',
    cta: {
      text: 'View Commission Details',
      link: '/register',
      type: 'primary'
    }
  },
  {
    id: 'getting-started',
    question: 'How quickly can I start earning commissions?',
    answer: 'You can start earning commissions within 24-48 hours of approval. Our streamlined onboarding process includes KYC verification, product training, and access to marketing materials. Once approved, you\'ll receive your unique referral links and can begin promoting immediately. First commissions are typically earned within the first week.',
    cta: {
      text: 'Start Your Application',
      link: '/register',
      type: 'primary'
    }
  },
  {
    id: 'support-training',
    question: 'What kind of support and training do you provide?',
    answer: 'We provide comprehensive support including dedicated account managers, 24/7 technical support, and extensive training resources. You\'ll get access to product training modules, marketing best practices, conversion optimization guides, and regular webinars with top-performing partners. Our support team is always available to help you maximize your earnings.',
    cta: {
      text: 'Learn About Support',
      link: '/register',
      type: 'secondary'
    }
  },
  {
    id: 'payment-schedule',
    question: 'When and how do I get paid?',
    answer: 'Commissions are paid monthly on the 15th of each month for the previous month\'s earnings. We support multiple payment methods including bank transfers, PayPal, and digital wallets. Minimum payout threshold is $100, and all payments are processed automatically. You can track your earnings in real-time through your partner dashboard.',
    cta: {
      text: 'See Payment Options',
      link: '/register',
      type: 'secondary'
    }
  },
  {
    id: 'marketing-materials',
    question: 'What marketing materials and tools are provided?',
    answer: 'We provide a comprehensive suite of marketing materials including banner ads, email templates, landing pages, product brochures, and video content. All materials are professionally designed and optimized for conversion. You\'ll also get access to tracking tools, analytics dashboards, and A/B testing capabilities to optimize your campaigns.',
    cta: {
      text: 'Explore Marketing Tools',
      link: '/register',
      type: 'secondary'
    }
  },
  {
    id: 'requirements',
    question: 'What are the requirements to become a partner?',
    answer: 'We welcome partners with various backgrounds and experience levels. Basic requirements include a valid business registration or professional credentials, compliance with financial regulations, and agreement to our terms of service. We particularly value partners with experience in financial services, established audiences, or strong digital marketing skills.',
    cta: {
      text: 'Check Eligibility',
      link: '/register',
      type: 'primary'
    }
  },
  {
    id: 'tracking-attribution',
    question: 'How accurate is the tracking and attribution?',
    answer: 'Our tracking system uses advanced attribution technology with 99.9% accuracy. We track across multiple touchpoints and devices, ensuring you get credit for all qualified referrals. Our system includes fraud detection, duplicate prevention, and real-time reporting. You can monitor clicks, conversions, and commissions through your detailed analytics dashboard.',
    cta: {
      text: 'See Tracking Demo',
      link: '/register',
      type: 'secondary'
    }
  },
  {
    id: 'product-categories',
    question: 'What types of financial products can I promote?',
    answer: 'Our product portfolio includes personal loans, business financing, investment products, insurance solutions, and financial planning services. Each category offers different commission rates and target audiences. You can choose to specialize in specific products or promote across multiple categories to maximize your earning potential.',
    cta: {
      text: 'Browse Products',
      link: '/register',
      type: 'primary'
    }
  }
];

export const FAQSection: React.FC<FAQSectionProps> = ({ className = '' }) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className={`py-20 bg-white ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get answers to common questions about our partner program, commissions, and support.
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((item) => {
            const isOpen = openItems.has(item.id);
            
            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                >
                  <span className="text-lg font-semibold text-gray-900 pr-4">
                    {item.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                
                <div
                  id={`faq-answer-${item.id}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 py-4 bg-white">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {item.answer}
                    </p>
                    
                    {item.cta && (
                      <div className="mt-4">
                        <Link
                          to={item.cta.link}
                          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            item.cta.type === 'primary'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item.cta.text}
                          <svg
                            className="ml-2 w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional CTA Section */}
        <div className="mt-16 text-center bg-blue-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Our partner success team is here to help you get started and maximize your earnings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Become a Partner
            </Link>
            <a
              href="mailto:partners@partneriq.com"
              className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;