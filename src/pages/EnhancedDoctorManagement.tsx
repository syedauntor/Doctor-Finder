import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, CreditCard as Edit, Trash2, Save, X, ShieldCheck, Plus, Upload, Image as ImageIcon } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  profile_image: string;
  overview: string;
  years_of_experience: number;
  is_verified: boolean;
  verification_status: string;
  verification_notes: string;
  bmdc_number: string;
  designation: string;
  fee_new_patient: number;
  fee_old_patient: number;
  fee_report_checking: number;
  gender: string;
}

interface Education {
  id?: string;
  doctor_id: string;
  degree: string;
  institution: string;
  year: number;
}

interface CurrentExperience {
  id?: string;
  doctor_id: string;
  institution: string;
  position: string;
  department: string;
  since_year: number;
}

interface PreviousExperience {
  id?: string;
  doctor_id: string;
  institution: string;
  position: string;
  department: string;
  start_year: number;
  end_year: number;
}

interface DoctorManagementProps {
  doctorId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export default function EnhancedDoctorManagement({ doctorId, onBack, onUpdate }: DoctorManagementProps) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [currentExperience, setCurrentExperience] = useState<CurrentExperience[]>([]);
  const [previousExperience, setPreviousExperience] = useState<PreviousExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedDoctor, setEditedDoctor] = useState<Partial<Doctor>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'education' | 'experience'>('basic');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadDoctorData();
  }, [doctorId]);

  async function loadDoctorData() {
    try {
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .single();

      if (doctorError) throw doctorError;
      setDoctor(doctorData);
      setEditedDoctor(doctorData);
      setImageUrl(doctorData.profile_image || '');

      const { data: educationData } = await supabase
        .from('education')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('year', { ascending: false });
      setEducation(educationData || []);

      const { data: currentExpData } = await supabase
        .from('current_experience')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('since_year', { ascending: false });
      setCurrentExperience(currentExpData || []);

      const { data: previousExpData } = await supabase
        .from('previous_experience')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('end_year', { ascending: false });
      setPreviousExperience(previousExpData || []);
    } catch (error) {
      console.error('Error loading doctor data:', error);
      alert('Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBasic() {
    if (!doctor) return;

    try {
      const updateData = { ...editedDoctor, profile_image: imageUrl };
      const { error } = await supabase
        .from('doctors')
        .update(updateData)
        .eq('id', doctor.id);

      if (error) throw error;

      await loadDoctorData();
      setEditing(false);
      onUpdate();
      alert('Doctor profile updated successfully!');
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('Failed to update doctor profile');
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
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

      await loadDoctorData();
      onUpdate();
      alert(`Doctor ${newVerificationStatus ? 'verified' : 'unverified'} successfully!`);
    } catch (error) {
      console.error('Error toggling verification:', error);
      alert('Failed to update verification status');
    }
  }

  async function handleDelete() {
    if (!doctor) return;

    try {
      await supabase.from('education').delete().eq('doctor_id', doctor.id);
      await supabase.from('current_experience').delete().eq('doctor_id', doctor.id);
      await supabase.from('previous_experience').delete().eq('doctor_id', doctor.id);

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

  async function addEducation() {
    const newEdu: Education = {
      doctor_id: doctorId,
      degree: '',
      institution: '',
      year: new Date().getFullYear()
    };
    setEducation([newEdu, ...education]);
  }

  async function saveEducation(edu: Education, index: number) {
    try {
      if (edu.id) {
        const { error } = await supabase
          .from('education')
          .update(edu)
          .eq('id', edu.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('education')
          .insert([edu])
          .select()
          .single();
        if (error) throw error;
        const newEducation = [...education];
        newEducation[index] = data;
        setEducation(newEducation);
      }
      alert('Education saved successfully!');
    } catch (error) {
      console.error('Error saving education:', error);
      alert('Failed to save education');
    }
  }

  async function deleteEducation(id: string | undefined, index: number) {
    if (id) {
      try {
        const { error } = await supabase
          .from('education')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting education:', error);
        alert('Failed to delete education');
        return;
      }
    }
    setEducation(education.filter((_, i) => i !== index));
  }

  async function addCurrentExperience() {
    const newExp: CurrentExperience = {
      doctor_id: doctorId,
      institution: '',
      position: '',
      department: '',
      since_year: new Date().getFullYear()
    };
    setCurrentExperience([newExp, ...currentExperience]);
  }

  async function saveCurrentExperience(exp: CurrentExperience, index: number) {
    try {
      if (exp.id) {
        const { error } = await supabase
          .from('current_experience')
          .update(exp)
          .eq('id', exp.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('current_experience')
          .insert([exp])
          .select()
          .single();
        if (error) throw error;
        const newExp = [...currentExperience];
        newExp[index] = data;
        setCurrentExperience(newExp);
      }
      alert('Experience saved successfully!');
    } catch (error) {
      console.error('Error saving experience:', error);
      alert('Failed to save experience');
    }
  }

  async function deleteCurrentExperience(id: string | undefined, index: number) {
    if (id) {
      try {
        const { error } = await supabase
          .from('current_experience')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting experience:', error);
        alert('Failed to delete experience');
        return;
      }
    }
    setCurrentExperience(currentExperience.filter((_, i) => i !== index));
  }

  async function addPreviousExperience() {
    const newExp: PreviousExperience = {
      doctor_id: doctorId,
      institution: '',
      position: '',
      department: '',
      start_year: new Date().getFullYear(),
      end_year: new Date().getFullYear()
    };
    setPreviousExperience([newExp, ...previousExperience]);
  }

  async function savePreviousExperience(exp: PreviousExperience, index: number) {
    try {
      if (exp.id) {
        const { error } = await supabase
          .from('previous_experience')
          .update(exp)
          .eq('id', exp.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('previous_experience')
          .insert([exp])
          .select()
          .single();
        if (error) throw error;
        const newExp = [...previousExperience];
        newExp[index] = data;
        setPreviousExperience(newExp);
      }
      alert('Experience saved successfully!');
    } catch (error) {
      console.error('Error saving experience:', error);
      alert('Failed to save experience');
    }
  }

  async function deletePreviousExperience(id: string | undefined, index: number) {
    if (id) {
      try {
        const { error } = await supabase
          .from('previous_experience')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting experience:', error);
        alert('Failed to delete experience');
        return;
      }
    }
    setPreviousExperience(previousExperience.filter((_, i) => i !== index));
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
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200">
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
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveSection('basic')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeSection === 'basic'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveSection('education')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeSection === 'education'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Education ({education.length})
          </button>
          <button
            onClick={() => setActiveSection('experience')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeSection === 'experience'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Experience ({currentExperience.length + previousExperience.length})
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeSection === 'basic' && (
          <div className="space-y-6">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Basic Info
              </button>
            ) : (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleSaveBasic}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditedDoctor(doctor);
                    setImageUrl(doctor.profile_image || '');
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                {editing && (
                  <div>
                    <label className="cursor-pointer px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Max size: 5MB</p>
                  </div>
                )}
              </div>
            </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={editing ? editedDoctor.gender || '' : doctor.gender}
                  onChange={(e) => setEditedDoctor({ ...editedDoctor, gender: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Patient Fee (৳)</label>
                <input
                  type="number"
                  value={editing ? editedDoctor.fee_new_patient || 0 : doctor.fee_new_patient}
                  onChange={(e) => setEditedDoctor({ ...editedDoctor, fee_new_patient: parseInt(e.target.value) })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Old Patient Fee (৳)</label>
                <input
                  type="number"
                  value={editing ? editedDoctor.fee_old_patient || 0 : doctor.fee_old_patient}
                  onChange={(e) => setEditedDoctor({ ...editedDoctor, fee_old_patient: parseInt(e.target.value) })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Checking Fee (৳)</label>
                <input
                  type="number"
                  value={editing ? editedDoctor.fee_report_checking || 0 : doctor.fee_report_checking}
                  onChange={(e) => setEditedDoctor({ ...editedDoctor, fee_report_checking: parseInt(e.target.value) })}
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
        )}

        {activeSection === 'education' && (
          <div className="space-y-4">
            <button
              onClick={addEducation}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Education
            </button>

            {education.map((edu, index) => (
              <div key={edu.id || index} className="border border-gray-300 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEducation = [...education];
                        newEducation[index].degree = e.target.value;
                        setEducation(newEducation);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., MBBS, FCPS"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const newEducation = [...education];
                        newEducation[index].institution = e.target.value;
                        setEducation(newEducation);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Institution name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input
                      type="number"
                      value={edu.year}
                      onChange={(e) => {
                        const newEducation = [...education];
                        newEducation[index].year = parseInt(e.target.value);
                        setEducation(newEducation);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEducation(edu, index)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Save className="h-4 w-4 inline mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => deleteEducation(edu.id, index)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="h-4 w-4 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {education.length === 0 && (
              <p className="text-center text-gray-500 py-8">No education records. Click "Add Education" to create one.</p>
            )}
          </div>
        )}

        {activeSection === 'experience' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Experience</h3>
                <button
                  onClick={addCurrentExperience}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Current
                </button>
              </div>

              {currentExperience.map((exp, index) => (
                <div key={exp.id || index} className="border border-gray-300 rounded-lg p-4 space-y-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                      <input
                        type="text"
                        value={exp.institution}
                        onChange={(e) => {
                          const newExp = [...currentExperience];
                          newExp[index].institution = e.target.value;
                          setCurrentExperience(newExp);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const newExp = [...currentExperience];
                          newExp[index].position = e.target.value;
                          setCurrentExperience(newExp);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <input
                        type="text"
                        value={exp.department}
                        onChange={(e) => {
                          const newExp = [...currentExperience];
                          newExp[index].department = e.target.value;
                          setCurrentExperience(newExp);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Since Year</label>
                      <input
                        type="number"
                        value={exp.since_year}
                        onChange={(e) => {
                          const newExp = [...currentExperience];
                          newExp[index].since_year = parseInt(e.target.value);
                          setCurrentExperience(newExp);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveCurrentExperience(exp, index)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Save className="h-4 w-4 inline mr-1" />
                      Save
                    </button>
                    <button
                      onClick={() => deleteCurrentExperience(exp.id, index)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Trash2 className="h-4 w-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {currentExperience.length === 0 && (
                <p className="text-center text-gray-500 py-4 mb-4 bg-gray-50 rounded-lg">No current experience records.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Previous Experience</h3>
                <button
                  onClick={addPreviousExperience}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Previous
                </button>
              </div>

              {previousExperience.map((exp, index) => (
                <div key={exp.id || index} className="border border-gray-300 rounded-lg p-4 space-y-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                      <input
                        type="text"
                        value={exp.institution}
                        onChange={(e) => {
                          const newExp = [...previousExperience];
                          newExp[index].institution = e.target.value;
                          setPreviousExperience(newExp);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const newExp = [...previousExperience];
                          newExp[index].position = e.target.value;
                          setPreviousExperience(newExp);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <input
                        type="text"
                        value={exp.department}
                        onChange={(e) => {
                          const newExp = [...previousExperience];
                          newExp[index].department = e.target.value;
                          setPreviousExperience(newExp);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Year</label>
                      <input
                        type="number"
                        value={exp.start_year}
                        onChange={(e) => {
                          const newExp = [...previousExperience];
                          newExp[index].start_year = parseInt(e.target.value);
                          setPreviousExperience(newExp);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Year</label>
                      <input
                        type="number"
                        value={exp.end_year}
                        onChange={(e) => {
                          const newExp = [...previousExperience];
                          newExp[index].end_year = parseInt(e.target.value);
                          setPreviousExperience(newExp);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => savePreviousExperience(exp, index)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Save className="h-4 w-4 inline mr-1" />
                      Save
                    </button>
                    <button
                      onClick={() => deletePreviousExperience(exp.id, index)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Trash2 className="h-4 w-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {previousExperience.length === 0 && (
                <p className="text-center text-gray-500 py-4 bg-gray-50 rounded-lg">No previous experience records.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {doctor.name}? This will also delete all related education and experience records. This action cannot be undone.
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
