import { Clock, Phone, CreditCard } from 'lucide-react';
import type { Doctor } from '../lib/supabase';

type DoctorCardProps = {
  doctor: Doctor;
  specialization?: string;
  onViewProfile: (doctorId: string) => void;
};

export default function DoctorCard({
  doctor,
  specialization,
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
            <h3 className="text-xl font-bold text-gray-800">{doctor.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{doctor.title}</p>
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

        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Consultation Fee</p>
            <p className="text-lg font-bold text-teal-600">
              ৳{doctor.consultation_fee}
            </p>
          </div>
          <button
            onClick={() => onViewProfile(doctor.id)}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}
