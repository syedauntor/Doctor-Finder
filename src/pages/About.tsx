import { Heart, Users, Award, Shield } from 'lucide-react';
import Footer from '../components/Footer';

export default function About() {
  const features = [
    {
      icon: Heart,
      title: 'Patient-Centered Care',
      description:
        'We connect patients with qualified doctors who prioritize compassionate, personalized healthcare.',
    },
    {
      icon: Users,
      title: 'Verified Professionals',
      description:
        'All doctors on our platform are verified healthcare professionals with proper qualifications and experience.',
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description:
        'We maintain high standards by featuring only top-rated doctors with excellent patient reviews.',
    },
    {
      icon: Shield,
      title: 'Trust & Safety',
      description:
        'Your health information is secure, and we ensure safe, reliable connections with healthcare providers.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-teal-50">
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            About Doctor Finder
          </h1>
          <p className="text-center text-teal-100 text-lg max-w-3xl mx-auto">
            Your trusted platform for finding and connecting with the best
            healthcare professionals in Bangladesh
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Mission</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            At Doctor Finder, we believe that everyone deserves access to
            quality healthcare. Our mission is to bridge the gap between
            patients and healthcare providers by creating a seamless platform
            where you can discover, learn about, and connect with experienced
            doctors across various specializations.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            We understand that finding the right doctor can be challenging.
            That's why we've built a comprehensive platform that provides
            detailed information about doctors, their qualifications,
            specializations, chamber locations, and consultation schedules. Our
            goal is to make healthcare more accessible and transparent for
            everyone.
          </p>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
          Why Choose Doctor Finder?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-teal-600 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-lg shadow-xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Our Commitment</h2>
          <p className="text-teal-100 text-lg max-w-3xl mx-auto leading-relaxed">
            We are committed to continuously improving our platform to serve you
            better. Our team works tirelessly to verify doctor credentials,
            update information, and ensure that you have access to the most
            accurate and helpful healthcare resources. Your health and wellbeing
            are our top priorities.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
