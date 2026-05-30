import { Link } from "react-router-dom";
import { Clock, Phone, CreditCard, ShieldCheck } from "lucide-react";

export default function DoctorCard({ doctor }) {
  const exp = doctor.current_experience;
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden" data-testid={`doctor-card-${doctor.id}`}>
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <img
            src={doctor.profile_image || "https://via.placeholder.com/150"}
            alt={doctor.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-teal-100"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-800">{doctor.name}</h3>
              {doctor.is_verified && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="text-xs font-medium">Verified</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{doctor.title}</p>
            {exp?.designation && (
              <p className="text-sm text-gray-700 mt-1 font-medium">
                {exp.designation}{exp.department ? ` of ${exp.department}` : ""}
              </p>
            )}
            {doctor.primary_specialization && (
              <span className="inline-block mt-2 px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                {doctor.primary_specialization}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-teal-600" />
            <span>{doctor.years_of_experience} years experience</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CreditCard className="h-4 w-4 mr-2 text-teal-600" />
            <span>BMDC: {doctor.bmdc_number || "N/A"}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-teal-600" />
            <span>{doctor.phone}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-xs text-gray-500">Consultation Fee</p>
            <p className="text-lg font-bold text-teal-600">৳{doctor.consultation_fee}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/doctors/${doctor.id}`}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-center"
              data-testid={`view-profile-btn-${doctor.id}`}
            >
              View Profile
            </Link>
            <Link
              to={`/book/${doctor.id}`}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
              data-testid={`book-now-btn-${doctor.id}`}
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
