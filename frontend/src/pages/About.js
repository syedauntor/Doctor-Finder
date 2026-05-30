import { Stethoscope, ShieldCheck, Users, HeartPulse } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12" data-testid="about-page">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">About Doctor Finder</h1>
      <p className="text-gray-700 text-lg leading-relaxed mb-8">
        Doctor Finder helps patients in Bangladesh discover and book appointments with verified doctors quickly and confidently.
        Our mission is to make healthcare accessible by bridging the gap between patients and specialists with transparency, verified profiles, and trusted information.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { icon: Stethoscope, title: "Verified Doctors", text: "Every doctor profile is verified against BMDC registration before being listed." },
          { icon: ShieldCheck, title: "Trusted Reviews", text: "Real patient ratings ensure quality service and accountability." },
          { icon: Users, title: "Wide Specialty Network", text: "Find the right specialist from over 20 categories of medicine." },
          { icon: HeartPulse, title: "Emergency Support", text: "24/7 ambulance hotline integration through 16263 for emergencies." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-white p-6 rounded-xl shadow border" data-testid={`about-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            <Icon className="h-10 w-10 text-teal-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-gray-600 mt-2">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
