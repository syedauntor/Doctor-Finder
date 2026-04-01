import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, Users, UserCheck, FileText, Eye } from 'lucide-react';
import Footer from '../components/Footer';

interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  bmdc_number: string;
  experience: string;
  message: string;
  status: string;
  created_at: string;
}

interface Doctor {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  is_verified: boolean;
  verification_status: string;
  verification_notes: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'requests' | 'doctors'>('requests');
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RegistrationRequest | Doctor | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsAdmin(!!adminData);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      if (activeTab === 'requests') {
        const { data, error } = await supabase
          .from('doctor_registration_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } else {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDoctors(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleApproveRequest(requestId: string) {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    try {
      const { data: newDoctor, error: doctorError } = await supabase
        .from('doctors')
        .insert([
          {
            name: request.name,
            title: '',
            email: request.email,
            phone: request.phone,
            overview: request.message,
            years_of_experience: parseInt(request.experience) || 0,
            is_verified: true,
            verification_status: 'approved',
            verification_notes: verificationNotes
          }
        ])
        .select()
        .single();

      if (doctorError) throw doctorError;

      const { error: updateError } = await supabase
        .from('doctor_registration_requests')
        .update({
          status: 'approved',
          doctor_id: newDoctor.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      setSelectedItem(null);
      setVerificationNotes('');
      loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      const { error } = await supabase
        .from('doctor_registration_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      setSelectedItem(null);
      setVerificationNotes('');
      loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  }

  async function handleUpdateDoctorVerification(doctorId: string, verified: boolean) {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          is_verified: verified,
          verification_status: verified ? 'approved' : 'rejected',
          verification_notes: verificationNotes
        })
        .eq('id', doctorId);

      if (error) throw error;

      setSelectedItem(null);
      setVerificationNotes('');
      loadData();
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('Failed to update doctor verification');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have admin permissions to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-teal-100 mt-2">Manage doctor registrations and verifications</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Pending Requests</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-12 w-12 text-blue-400" />
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Verified Doctors</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {doctors.filter(d => d.is_verified).length}
                  </p>
                </div>
                <UserCheck className="h-12 w-12 text-green-400" />
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Doctors</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{doctors.length}</p>
                </div>
                <Users className="h-12 w-12 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'requests'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="inline-block h-5 w-5 mr-2" />
                Registration Requests
              </button>
              <button
                onClick={() => setActiveTab('doctors')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'doctors'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="inline-block h-5 w-5 mr-2" />
                All Doctors
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'requests' ? (
              <div className="space-y-4">
                {requests.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No registration requests found.</p>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{request.specialty}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
                            <p className="text-gray-600">
                              <span className="font-medium">Email:</span> {request.email}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Phone:</span> {request.phone}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">BMDC:</span> {request.bmdc_number}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Experience:</span> {request.experience} years
                            </p>
                          </div>
                          {request.message && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Message:</span> {request.message}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col items-end">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {request.status}
                          </span>
                          {request.status === 'pending' && (
                            <button
                              onClick={() => setSelectedItem(request)}
                              className="mt-2 text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {doctors.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No doctors found.</p>
                ) : (
                  doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{doctor.title}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
                            <p className="text-gray-600">
                              <span className="font-medium">Email:</span> {doctor.email}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Phone:</span> {doctor.phone}
                            </p>
                          </div>
                          {doctor.verification_notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Notes:</span> {doctor.verification_notes}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col items-end">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              doctor.is_verified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {doctor.is_verified ? 'Verified' : 'Not Verified'}
                          </span>
                          <button
                            onClick={() => setSelectedItem(doctor)}
                            className="mt-2 text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {'bmdc_number' in selectedItem ? 'Review Registration Request' : 'Manage Doctor'}
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Notes
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Add notes about verification, reasons for approval/rejection, etc."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {'bmdc_number' in selectedItem ? (
                  <>
                    <button
                      onClick={() => handleApproveRequest(selectedItem.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Approve & Create Profile
                    </button>
                    <button
                      onClick={() => handleRejectRequest(selectedItem.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleUpdateDoctorVerification(selectedItem.id, true)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Mark as Verified
                    </button>
                    <button
                      onClick={() => handleUpdateDoctorVerification(selectedItem.id, false)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Remove Verification
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setVerificationNotes('');
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
