import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, Users, UserCheck, FileText, Eye, LogOut, Home, Calendar, Settings, Plus, Trash2, Save } from 'lucide-react';
import Footer from '../components/Footer';
import EnhancedDoctorManagement from './EnhancedDoctorManagement';

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

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  consultation_type: string;
  notes: string;
  doctors: {
    name: string;
    email: string;
  };
  patients: {
    name: string;
    email: string;
    phone: string;
  };
}

interface Specialization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'doctors' | 'appointments' | 'settings'>('requests');
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RegistrationRequest | Doctor | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [managingDoctorId, setManagingDoctorId] = useState<string | null>(null);

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
      } else if (activeTab === 'doctors') {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDoctors(data || []);
      } else if (activeTab === 'appointments') {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            doctors (name, email),
            patients (name, email, phone)
          `)
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false });

        if (error) throw error;
        setAppointments(data || []);
      } else if (activeTab === 'settings') {
        const { data, error } = await supabase
          .from('specializations')
          .select('*')
          .order('name');

        if (error) throw error;
        setSpecializations(data || []);
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

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      onNavigate('home');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  async function handleAddSpecialization() {
    if (!newSpecialization.trim()) {
      alert('Please enter a specialization name');
      return;
    }

    try {
      const slug = newSpecialization.toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase
        .from('specializations')
        .insert([{ name: newSpecialization.trim(), slug }]);

      if (error) throw error;

      setNewSpecialization('');
      loadData();
      alert('Specialization added successfully!');
    } catch (error) {
      console.error('Error adding specialization:', error);
      alert('Failed to add specialization');
    }
  }

  async function handleDeleteSpecialization(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will remove it from all doctors.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('specializations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadData();
      alert('Specialization deleted successfully!');
    } catch (error) {
      console.error('Error deleting specialization:', error);
      alert('Failed to delete specialization');
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

  if (managingDoctorId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-teal-100 mt-2">Manage doctor profile</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedDoctorManagement
            doctorId={managingDoctorId}
            onBack={() => setManagingDoctorId(null)}
            onUpdate={loadData}
          />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-teal-100 mt-2">Manage doctor registrations and verifications</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('home')}
                className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Home className="h-5 w-5" />
                Home
              </button>
              <button
                onClick={handleLogout}
                className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            <div className="bg-teal-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-teal-600 font-medium">Total Appointments</p>
                  <p className="text-3xl font-bold text-teal-900 mt-2">{appointments.length}</p>
                </div>
                <Calendar className="h-12 w-12 text-teal-400" />
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
              <button
                onClick={() => setActiveTab('appointments')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'appointments'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="inline-block h-5 w-5 mr-2" />
                Appointments
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="inline-block h-5 w-5 mr-2" />
                Settings
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'requests' && (
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
            )}

            {activeTab === 'doctors' && (
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
                            onClick={() => setManagingDoctorId(doctor.id)}
                            className="mt-2 text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No appointments found.</p>
                ) : (
                  appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {appointment.patients.name}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : appointment.status === 'confirmed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : appointment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {appointment.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Doctor:</span> {appointment.doctors.name}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <p className="text-gray-600">
                              <span className="font-medium">Date:</span>{' '}
                              {new Date(appointment.appointment_date).toLocaleDateString()}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Time:</span>{' '}
                              {appointment.appointment_time.slice(0, 5)}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Patient Phone:</span> {appointment.patients.phone}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Type:</span>{' '}
                              {appointment.consultation_type === 'in-person' ? 'In-Person' : 'Online'}
                            </p>
                          </div>
                          {appointment.notes && (
                            <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-700">Patient Notes:</p>
                              <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Available Specializations Management</h3>
                  <p className="text-sm text-blue-700">
                    Add or remove specializations that doctors can select for their profiles.
                  </p>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialization()}
                    placeholder="Enter new specialization name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddSpecialization}
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Add
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specializations.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 col-span-2">No specializations found.</p>
                  ) : (
                    specializations.map((spec) => (
                      <div
                        key={spec.id}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div>
                          <h4 className="font-semibold text-gray-900">{spec.name}</h4>
                          <p className="text-sm text-gray-500">Slug: {spec.slug}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteSpecialization(spec.id, spec.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete specialization"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
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

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
