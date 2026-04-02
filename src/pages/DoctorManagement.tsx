import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, CreditCard as Edit, Trash2, Save, X, Shield, ShieldCheck } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  overview: string;
  years_of_experience: number;
  is_verified: boolean;
  verification_status: string;
  verification_notes: string;
  specialty: string;
  bmdc_number: string;
  research_interest: string;
  area_of_expertise: string;
  designation: string;
  medical_college: string;
  new_patient_fee: number;
  old_patient_fee: number;
  report_follow_up_fee: number;
  division: string;
  district: string;
  area: string;
  chamber_name: string;
  chamber_address: string;
  created_at: string;
}

interface DoctorManagementProps {
  doctorId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export default function DoctorManagement({ doctorId, onBack, onUpdate }: DoctorManagementProps) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedDoctor, setEditedDoctor] = useState<Partial<Doctor>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadDoctor();
  }, [doctorId]);

  async function loadDoctor() {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .single();

      if (error) throw error;
      setDoctor(data);
      setEditedDoctor(data);
    } catch (error) {
      console.error('Error loading doctor:', error);
      alert('Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!doctor) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .update(editedDoctor)
        .eq('id', doctor.id);

      if (error) throw error;

      await loadDoctor();
      setEditing(false);
      onUpdate();
      alert('Doctor profile updated successfully!');
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('Failed to update doctor profile');
    }
  }

  async function handleDelete() {
    if (!doctor) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', doctor.id);

      if (error) throw error;

      alert('Doctor profile deleted successfully!');
      onUpdate();
      onBack();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor profile');
    }
  }

  async function toggleVerification() {
    if (!doctor) return;

    try {
      const newVerificationStatus = !doctor.is_verified;
      const { error } = await supabase
        .from('doctors')
        .update({
          is_verified: newVerificationStatus,
          verification_status: newVerificationStatus ? 'approved' : 'pending'
        })
        .eq('id', doctor.id);

      if (error) throw error;

      await loadDoctor();
      onUpdate();
      alert(`Doctor ${newVerificationStatus ? 'verified' : 'unverified'} successfully!`);
    } catch (error) {
      console.error('Error toggling verification:', error);
      alert('Failed to update verification status');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Doctor not found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Manage Doctor Profile</h2>
          {doctor.is_verified && (
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <ShieldCheck className="h-4 w-4" />
              Verified
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={toggleVerification}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  doctor.is_verified
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {doctor.is_verified ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    Remove Verification
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Verify Doctor
                  </>
                )}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditedDoctor(doctor);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={editing ? editedDoctor.name || '' : doctor.name}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, name: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title/Qualification</label>
            <input
              type="text"
              value={editing ? editedDoctor.title || '' : doctor.title}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, title: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={editing ? editedDoctor.email || '' : doctor.email}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, email: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="text"
              value={editing ? editedDoctor.phone || '' : doctor.phone}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, phone: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
            <input
              type="text"
              value={editing ? editedDoctor.specialty || '' : doctor.specialty}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, specialty: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">BMDC Number</label>
            <input
              type="text"
              value={editing ? editedDoctor.bmdc_number || '' : doctor.bmdc_number}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, bmdc_number: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
            <input
              type="text"
              value={editing ? editedDoctor.designation || '' : doctor.designation}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, designation: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medical College</label>
            <input
              type="text"
              value={editing ? editedDoctor.medical_college || '' : doctor.medical_college}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, medical_college: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
            <input
              type="number"
              value={editing ? editedDoctor.years_of_experience || 0 : doctor.years_of_experience}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, years_of_experience: parseInt(e.target.value) })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Patient Fee (৳)</label>
            <input
              type="number"
              value={editing ? editedDoctor.new_patient_fee || 0 : doctor.new_patient_fee}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, new_patient_fee: parseInt(e.target.value) })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Old Patient Fee (৳)</label>
            <input
              type="number"
              value={editing ? editedDoctor.old_patient_fee || 0 : doctor.old_patient_fee}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, old_patient_fee: parseInt(e.target.value) })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Follow-up Fee (৳)</label>
            <input
              type="number"
              value={editing ? editedDoctor.report_follow_up_fee || 0 : doctor.report_follow_up_fee}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, report_follow_up_fee: parseInt(e.target.value) })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Overview</label>
          <textarea
            value={editing ? editedDoctor.overview || '' : doctor.overview}
            onChange={(e) => setEditedDoctor({ ...editedDoctor, overview: e.target.value })}
            disabled={!editing}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Research Interest</label>
          <textarea
            value={editing ? editedDoctor.research_interest || '' : doctor.research_interest}
            onChange={(e) => setEditedDoctor({ ...editedDoctor, research_interest: e.target.value })}
            disabled={!editing}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Area of Expertise</label>
          <textarea
            value={editing ? editedDoctor.area_of_expertise || '' : doctor.area_of_expertise}
            onChange={(e) => setEditedDoctor({ ...editedDoctor, area_of_expertise: e.target.value })}
            disabled={!editing}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
            <input
              type="text"
              value={editing ? editedDoctor.division || '' : doctor.division}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, division: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
            <input
              type="text"
              value={editing ? editedDoctor.district || '' : doctor.district}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, district: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
            <input
              type="text"
              value={editing ? editedDoctor.area || '' : doctor.area}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, area: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chamber Name</label>
          <input
            type="text"
            value={editing ? editedDoctor.chamber_name || '' : doctor.chamber_name}
            onChange={(e) => setEditedDoctor({ ...editedDoctor, chamber_name: e.target.value })}
            disabled={!editing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chamber Address</label>
          <textarea
            value={editing ? editedDoctor.chamber_address || '' : doctor.chamber_address}
            onChange={(e) => setEditedDoctor({ ...editedDoctor, chamber_address: e.target.value })}
            disabled={!editing}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Verification Notes</label>
          <textarea
            value={editing ? editedDoctor.verification_notes || '' : doctor.verification_notes}
            onChange={(e) => setEditedDoctor({ ...editedDoctor, verification_notes: e.target.value })}
            disabled={!editing}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
            placeholder="Admin notes about verification status"
          />
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {doctor.name}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
