import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, X, Plus, Upload, Image as ImageIcon, MapPin, ExternalLink, Trash2, ArrowLeft, Star } from 'lucide-react';
import AutocompleteInput from '../components/AutocompleteInput';
import LocationPicker from '../components/LocationPicker';
import Footer from '../components/Footer';

interface Doctor {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  profile_image: string;
  overview: string;
  years_of_experience: number;
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
  designation: string;
  department: string;
  department_id?: string;
  since_year: number;
}

interface PreviousExperience {
  id?: string;
  doctor_id: string;
  institution: string;
  designation: string;
  department: string;
  department_id?: string;
  start_year: number;
  end_year: number;
}

interface Chamber {
  id?: string;
  doctor_id: string;
  name: string;
  address: string;
  area: string;
  city: string;
  division: string;
  district: string;
  upazila: string;
  latitude?: number;
  longitude?: number;
  map_url?: string;
}

interface Specialization {
  id: string;
  name: string;
  slug: string;
}

interface Department {
  id: string;
  name: string;
  slug: string;
}

interface DoctorSpecialization {
  id?: string;
  doctor_id: string;
  specialization_id: string;
  is_primary: boolean;
  specializations?: Specialization;
}

export default function DoctorProfileEdit() {
  const { user, doctorId, loading: authLoading } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [currentExperience, setCurrentExperience] = useState<CurrentExperience[]>([]);
  const [previousExperience, setPreviousExperience] = useState<PreviousExperience[]>([]);
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctorSpecializations, setDoctorSpecializations] = useState<DoctorSpecialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedDoctor, setEditedDoctor] = useState<Partial<Doctor>>({});
  const [activeSection, setActiveSection] = useState<'basic' | 'specializations' | 'education' | 'experience' | 'chambers'>('basic');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedChamberIndex, setSelectedChamberIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/doctor-login';
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (doctorId) {
      loadDoctorData();
      loadSpecializations();
    }
  }, [doctorId]);

  async function loadSpecializations() {
    try {
      const [specializationsRes, departmentsRes] = await Promise.all([
        supabase.from('specializations').select('*').order('name'),
        supabase.from('departments').select('*').order('name'),
      ]);

      if (specializationsRes.error) throw specializationsRes.error;
      if (departmentsRes.error) throw departmentsRes.error;

      setSpecializations(specializationsRes.data || []);
      setDepartments(departmentsRes.data || []);
    } catch (error) {
      console.error('Error loading specializations and departments:', error);
    }
  }

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

      const { data: chambersData } = await supabase
        .from('chambers')
        .select('*')
        .eq('doctor_id', doctorId);
      setChambers(chambersData || []);

      const { data: docSpecData } = await supabase
        .from('doctor_specializations')
        .select('*, specializations(*)')
        .eq('doctor_id', doctorId);
      setDoctorSpecializations(docSpecData || []);
    } catch (error) {
      console.error('Error loading doctor data:', error);
      alert('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBasic() {
    if (!doctor) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .update(editedDoctor)
        .eq('id', doctor.id);

      if (error) throw error;

      setDoctor({ ...doctor, ...editedDoctor });
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !doctor) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${doctor.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('doctor-profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('doctor-profiles')
        .getPublicUrl(filePath);

      const newImageUrl = urlData.publicUrl;
      setImageUrl(newImageUrl);
      setEditedDoctor({ ...editedDoctor, profile_image: newImageUrl });

      const { error: updateError } = await supabase
        .from('doctors')
        .update({ profile_image: newImageUrl })
        .eq('id', doctor.id);

      if (updateError) throw updateError;

      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }

  async function addEducation() {
    const newEdu: Education = {
      doctor_id: doctorId!,
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
        const newEdu = [...education];
        newEdu[index] = data;
        setEducation(newEdu);
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
      doctor_id: doctorId!,
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
      doctor_id: doctorId!,
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

  async function addChamber() {
    const newChamber: Chamber = {
      doctor_id: doctorId!,
      name: '',
      address: '',
      area: '',
      city: '',
      division: '',
      district: '',
      upazila: ''
    };
    setChambers([newChamber, ...chambers]);
  }

  async function saveChamber(chamber: Chamber, index: number) {
    try {
      if (chamber.id) {
        const { error } = await supabase
          .from('chambers')
          .update(chamber)
          .eq('id', chamber.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('chambers')
          .insert([chamber])
          .select()
          .single();
        if (error) throw error;
        const newChambers = [...chambers];
        newChambers[index] = data;
        setChambers(newChambers);
      }
      alert('Chamber saved successfully!');
    } catch (error) {
      console.error('Error saving chamber:', error);
      alert('Failed to save chamber');
    }
  }

  async function deleteChamber(id: string | undefined, index: number) {
    if (id) {
      try {
        const { error } = await supabase
          .from('chambers')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting chamber:', error);
        alert('Failed to delete chamber');
        return;
      }
    }
    setChambers(chambers.filter((_, i) => i !== index));
  }

  function handleSetLocation(index: number) {
    setSelectedChamberIndex(index);
    setShowLocationPicker(true);
  }

  async function handleSaveLocation(lat: number, lng: number, mapUrl: string) {
    if (selectedChamberIndex === null) return;

    const updatedChambers = [...chambers];
    updatedChambers[selectedChamberIndex] = {
      ...updatedChambers[selectedChamberIndex],
      latitude: lat,
      longitude: lng,
      map_url: mapUrl
    };
    setChambers(updatedChambers);
    setShowLocationPicker(false);
    setSelectedChamberIndex(null);

    if (updatedChambers[selectedChamberIndex].id) {
      await saveChamber(updatedChambers[selectedChamberIndex], selectedChamberIndex);
    }
  }

  async function toggleSpecialization(specializationId: string) {
    const existing = doctorSpecializations.find(ds => ds.specialization_id === specializationId);

    if (existing) {
      try {
        const { error } = await supabase
          .from('doctor_specializations')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        setDoctorSpecializations(doctorSpecializations.filter(ds => ds.id !== existing.id));
        alert('Specialization removed successfully!');
      } catch (error) {
        console.error('Error removing specialization:', error);
        alert('Failed to remove specialization');
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('doctor_specializations')
          .insert([{
            doctor_id: doctorId!,
            specialization_id: specializationId,
            is_primary: doctorSpecializations.length === 0
          }])
          .select('*, specializations(*)')
          .single();

        if (error) throw error;
        setDoctorSpecializations([...doctorSpecializations, data]);
        alert('Specialization added successfully!');
      } catch (error) {
        console.error('Error adding specialization:', error);
        alert('Failed to add specialization');
      }
    }
  }

  async function setPrimarySpecialization(docSpecId: string) {
    try {
      await supabase
        .from('doctor_specializations')
        .update({ is_primary: false })
        .eq('doctor_id', doctorId);

      const { error } = await supabase
        .from('doctor_specializations')
        .update({ is_primary: true })
        .eq('id', docSpecId);

      if (error) throw error;

      const updated = doctorSpecializations.map(ds => ({
        ...ds,
        is_primary: ds.id === docSpecId
      }));
      setDoctorSpecializations(updated);
      alert('Primary specialization updated!');
    } catch (error) {
      console.error('Error setting primary specialization:', error);
      alert('Failed to set primary specialization');
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-red-600">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <a
            href="/?page=doctor-dashboard"
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white">
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-teal-100 mt-2">Manage your professional information</p>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-4">
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
                onClick={() => setActiveSection('specializations')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeSection === 'specializations'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Specializations ({doctorSpecializations.length})
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
              <button
                onClick={() => setActiveSection('chambers')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeSection === 'chambers'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Chambers & Location ({chambers.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeSection === 'basic' && (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={doctor.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-teal-100"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors">
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF (max 5MB)</p>
                  </div>
                </div>

                {!editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <p className="text-gray-900">{doctor.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <p className="text-gray-900">{doctor.title}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <p className="text-gray-900">{doctor.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <p className="text-gray-900">{doctor.phone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">BMDC Number</label>
                        <p className="text-gray-900">{doctor.bmdc_number}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                        <p className="text-gray-900">{doctor.designation}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <p className="text-gray-900">{doctor.gender}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                        <p className="text-gray-900">{doctor.years_of_experience}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fee (New Patient)</label>
                        <p className="text-gray-900">৳{doctor.fee_new_patient}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fee (Old Patient)</label>
                        <p className="text-gray-900">৳{doctor.fee_old_patient}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fee (Report Checking)</label>
                        <p className="text-gray-900">৳{doctor.fee_report_checking}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Overview</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{doctor.overview}</p>
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Edit Basic Info
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={editedDoctor.name}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={editedDoctor.title}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={editedDoctor.email}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={editedDoctor.phone}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">BMDC Number</label>
                        <input
                          type="text"
                          value={editedDoctor.bmdc_number}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, bmdc_number: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                        <input
                          type="text"
                          value={editedDoctor.designation}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, designation: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <select
                          value={editedDoctor.gender}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, gender: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                        <input
                          type="number"
                          value={editedDoctor.years_of_experience}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, years_of_experience: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fee (New Patient)</label>
                        <input
                          type="number"
                          value={editedDoctor.fee_new_patient}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, fee_new_patient: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fee (Old Patient)</label>
                        <input
                          type="number"
                          value={editedDoctor.fee_old_patient}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, fee_old_patient: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fee (Report Checking)</label>
                        <input
                          type="number"
                          value={editedDoctor.fee_report_checking}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, fee_report_checking: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Overview</label>
                      <textarea
                        value={editedDoctor.overview}
                        onChange={(e) => setEditedDoctor({ ...editedDoctor, overview: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveBasic}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditedDoctor(doctor);
                        }}
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'specializations' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Field of Concentration</h3>
                  <p className="text-sm text-blue-700">
                    Select all specializations that apply to your practice. Mark one as primary to highlight your main area of expertise.
                  </p>
                </div>

                {doctorSpecializations.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-gray-900">Your Specializations:</h4>
                    {doctorSpecializations.map((docSpec) => (
                      <div key={docSpec.id} className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          {docSpec.is_primary && (
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          )}
                          <span className="font-medium text-gray-900">
                            {docSpec.specializations?.name}
                          </span>
                          {docSpec.is_primary && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!docSpec.is_primary && (
                            <button
                              onClick={() => setPrimarySpecialization(docSpec.id!)}
                              className="px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                            >
                              Set as Primary
                            </button>
                          )}
                          <button
                            onClick={() => toggleSpecialization(docSpec.specialization_id)}
                            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Available Specializations:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {specializations.map((spec) => {
                      const isSelected = doctorSpecializations.some(ds => ds.specialization_id === spec.id);
                      return (
                        <button
                          key={spec.id}
                          onClick={() => toggleSpecialization(spec.id)}
                          disabled={isSelected}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50 cursor-not-allowed opacity-50'
                              : 'border-gray-200 hover:border-teal-500 hover:bg-teal-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{spec.name}</span>
                            {isSelected && (
                              <span className="text-teal-600 font-semibold">Selected</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {doctorSpecializations.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No specializations selected yet. Click on any specialization above to add it.
                  </div>
                )}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const newEdu = [...education];
                            newEdu[index].degree = e.target.value;
                            setEducation(newEdu);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const newEdu = [...education];
                            newEdu[index].institution = e.target.value;
                            setEducation(newEdu);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                        <input
                          type="number"
                          value={edu.year}
                          onChange={(e) => {
                            const newEdu = [...education];
                            newEdu[index].year = parseInt(e.target.value);
                            setEducation(newEdu);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEducation(edu, index)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={() => deleteEducation(edu.id, index)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {education.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No education records yet. Click "Add Education" to create one.</p>
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
                          <AutocompleteInput
                            type="institution"
                            value={exp.institution}
                            onChange={(value) => {
                              const newExp = [...currentExperience];
                              newExp[index].institution = value;
                              setCurrentExperience(newExp);
                            }}
                            placeholder="Search or add institution"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                          <AutocompleteInput
                            type="designation"
                            value={exp.designation}
                            onChange={(value) => {
                              const newExp = [...currentExperience];
                              newExp[index].designation = value;
                              setCurrentExperience(newExp);
                            }}
                            placeholder="Search or add designation"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                          <select
                            value={exp.department_id || ''}
                            onChange={(e) => {
                              const newExp = [...currentExperience];
                              newExp[index].department_id = e.target.value;
                              const dept = departments.find(d => d.id === e.target.value);
                              newExp[index].department = dept?.name || '';
                              setCurrentExperience(newExp);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="">Select department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
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
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </button>
                        <button
                          onClick={() => deleteCurrentExperience(exp.id, index)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
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
                          <AutocompleteInput
                            type="institution"
                            value={exp.institution}
                            onChange={(value) => {
                              const newExp = [...previousExperience];
                              newExp[index].institution = value;
                              setPreviousExperience(newExp);
                            }}
                            placeholder="Search or add institution"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                          <AutocompleteInput
                            type="designation"
                            value={exp.designation}
                            onChange={(value) => {
                              const newExp = [...previousExperience];
                              newExp[index].designation = value;
                              setPreviousExperience(newExp);
                            }}
                            placeholder="Search or add designation"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                          <select
                            value={exp.department_id || ''}
                            onChange={(e) => {
                              const newExp = [...previousExperience];
                              newExp[index].department_id = e.target.value;
                              const dept = departments.find(d => d.id === e.target.value);
                              newExp[index].department = dept?.name || '';
                              setPreviousExperience(newExp);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="">Select department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
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
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </button>
                        <button
                          onClick={() => deletePreviousExperience(exp.id, index)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
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

            {activeSection === 'chambers' && (
              <div className="space-y-4">
                <button
                  onClick={addChamber}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Chamber
                </button>

                {chambers.map((chamber, index) => (
                  <div key={chamber.id || index} className="border border-gray-300 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chamber Name</label>
                        <input
                          type="text"
                          value={chamber.name}
                          onChange={(e) => {
                            const newChambers = [...chambers];
                            newChambers[index].name = e.target.value;
                            setChambers(newChambers);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="e.g., Popular Diagnostic Centre"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={chamber.city}
                          onChange={(e) => {
                            const newChambers = [...chambers];
                            newChambers[index].city = e.target.value;
                            setChambers(newChambers);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="e.g., Dhaka"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <input
                          type="text"
                          value={chamber.address}
                          onChange={(e) => {
                            const newChambers = [...chambers];
                            newChambers[index].address = e.target.value;
                            setChambers(newChambers);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Full address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                        <input
                          type="text"
                          value={chamber.area}
                          onChange={(e) => {
                            const newChambers = [...chambers];
                            newChambers[index].area = e.target.value;
                            setChambers(newChambers);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="e.g., Dhanmondi"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                        <input
                          type="text"
                          value={chamber.division}
                          onChange={(e) => {
                            const newChambers = [...chambers];
                            newChambers[index].division = e.target.value;
                            setChambers(newChambers);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="e.g., Dhaka"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                        <input
                          type="text"
                          value={chamber.district}
                          onChange={(e) => {
                            const newChambers = [...chambers];
                            newChambers[index].district = e.target.value;
                            setChambers(newChambers);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="e.g., Dhaka"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upazila</label>
                        <input
                          type="text"
                          value={chamber.upazila}
                          onChange={(e) => {
                            const newChambers = [...chambers];
                            newChambers[index].upazila = e.target.value;
                            setChambers(newChambers);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    {chamber.latitude && chamber.longitude && (
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-teal-900">Location Set</p>
                          <p className="text-xs text-teal-700 mt-1">
                            Lat: {chamber.latitude.toFixed(6)}, Lng: {chamber.longitude.toFixed(6)}
                          </p>
                        </div>
                        {chamber.map_url && (
                          <a
                            href={chamber.map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => saveChamber(chamber, index)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Save className="h-4 w-4" />
                        Save Chamber
                      </button>
                      <button
                        onClick={() => handleSetLocation(index)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <MapPin className="h-4 w-4" />
                        {chamber.latitude ? 'Edit Location' : 'Set Location'}
                      </button>
                      {chamber.map_url && (
                        <a
                          href={chamber.map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Get Directions
                        </a>
                      )}
                      <button
                        onClick={() => deleteChamber(chamber.id, index)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {chambers.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No chambers added yet. Click "Add Chamber" to create one.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLocationPicker && selectedChamberIndex !== null && (
        <LocationPicker
          latitude={chambers[selectedChamberIndex]?.latitude}
          longitude={chambers[selectedChamberIndex]?.longitude}
          address={chambers[selectedChamberIndex]?.address}
          onSave={handleSaveLocation}
          onCancel={() => {
            setShowLocationPicker(false);
            setSelectedChamberIndex(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
