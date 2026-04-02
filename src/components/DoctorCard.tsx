import { Clock, Phone, CreditCard, ShieldCheck } from 'lucide-react';
import type { Doctor } from '../lib/supabase';

type DoctorCardProps = {
  doctor: Doctor;
  specialization?: string;
  position?: { position: string; department: string };
  onViewProfile: (doctorId: string) => void;
};

export default function DoctorCard({
  doctor,
  specialization,
  position,
  onViewProfile,
}: DoctorCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <img
            src={doctor.profile_image || 'https://via.placeholder.com/150'}
            alt={doctor.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-teal-100"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-800">{doctor.name}</h3>
              {doctor.is_verified && (
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-medium">Verified</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{doctor.title}</p>
            {position && (
              <p className="text-sm text-gray-700 mt-1 font-medium">
                {position.position} of {position.department}
              </p>
            )}
            {specialization && (
              <span className="inline-block mt-2 px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                {specialization}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-teal-600" />
            <span>{doctor.years_of_experience} years experience</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CreditCard className="h-4 w-4 mr-2 text-teal-600" />
            <span>BMDC: {doctor.bmdc_number || 'N/A'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-teal-600" />
            <span>{doctor.phone}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-xs text-gray-500">Consultation Fee</p>
            <p className="text-lg font-bold text-teal-600">
              ৳{doctor.consultation_fee}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onViewProfile(doctor.id)}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              View Profile
            </button>
            <a
              href={`/?page=book-appointment&doctor=${doctor.id}`}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
            >
              Book Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
