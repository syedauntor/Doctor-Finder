import { useEffect, useState, useRef } from 'react';
import {
  Star,
  Phone,
  Mail,
  Award,
  GraduationCap,
  MapPin,
  Clock,
  ArrowLeft,
  Calendar,
  FileText,
  Lightbulb,
  CreditCard,
  Share2,
  Navigation,
  Printer,
  QrCode,
  Download,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  supabase,
  type Doctor,
  type Chamber,
  type ChamberSchedule,
  type Education,
  type Award as AwardType,
  type ResearchPublication,
  type Expertise as ExpertiseType,
  type CurrentExperience,
  type PreviousExperience,
} from '../lib/supabase';
import DoctorCard from '../components/DoctorCard';
import Footer from '../components/Footer';

type DoctorDetailProps = {
  doctorId: string;
  onNavigate: (page: string, doctorId?: string) => void;
};

type ChamberWithSchedules = Chamber & {
  schedules: ChamberSchedule[];
};

export default function DoctorDetail({
  doctorId,
  onNavigate,
}: DoctorDetailProps) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [chambers, setChambers] = useState<ChamberWithSchedules[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [researchPublications, setResearchPublications] = useState<ResearchPublication[]>([]);
  const [expertiseList, setExpertiseList] = useState<ExpertiseType[]>([]);
  const [currentExperience, setCurrentExperience] = useState<CurrentExperience[]>([]);
  const [previousExperience, setPreviousExperience] = useState<PreviousExperience[]>([]);
  const [similarDoctors, setSimilarDoctors] = useState<Doctor[]>([]);
  const [similarDocSpecs, setSimilarDocSpecs] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPrintCard, setShowPrintCard] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const printCardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `Dr. ${doctor?.name}`,
      text: `Check out Dr. ${doctor?.name}'s profile - ${specializations.join(', ')}`,
      url: url,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadQRCode = () => {
    const canvas = qrCodeRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Dr-${doctor?.name.replace(/\s+/g, '-')}-QR.png`;
      link.href = url;
      link.click();
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [doctorId]);

  async function loadDoctorData() {
    try {
      const [doctorRes, docSpecRes, chambersRes, educationRes, awardsRes, researchRes, expertiseRes, currentExpRes, previousExpRes] =
        await Promise.all([
          supabase.from('doctors').select('*').eq('id', doctorId).maybeSingle(),
          supabase
            .from('doctor_specializations')
            .select('specializations(name, id)')
            .eq('doctor_id', doctorId),
          supabase.from('chambers').select('*').eq('doctor_id', doctorId),
          supabase
            .from('education')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('year', { ascending: false }),
          supabase
            .from('awards')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('year', { ascending: false }),
          supabase
            .from('research_publications')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('year', { ascending: false }),
          supabase
            .from('expertise')
            .select('*')
            .eq('doctor_id', doctorId),
          supabase
            .from('current_experience')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('since_year', { ascending: false }),
          supabase
            .from('previous_experience')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('end_year', { ascending: false }),
        ]);

      if (doctorRes.data) {
        setDoctor(doctorRes.data);
      }

      if (docSpecRes.data) {
        const specs = docSpecRes.data
          .map((ds: any) => ds.specializations?.name)
          .filter(Boolean);
        setSpecializations(specs);

        if (docSpecRes.data.length > 0) {
          const primarySpecId = (docSpecRes.data[0] as any).specializations?.id;
          if (primarySpecId) {
            loadSimilarDoctors(primarySpecId);
          }
        }
      }

      if (chambersRes.data) {
        const chambersWithSchedules = await Promise.all(
          chambersRes.data.map(async (chamber) => {
            const { data: schedules } = await supabase
              .from('chamber_schedules')
              .select('*')
              .eq('chamber_id', chamber.id)
              .order('day_of_week');

            return {
              ...chamber,
              schedules: schedules || [],
            };
          })
        );
        setChambers(chambersWithSchedules);
      }

      if (educationRes.data) setEducation(educationRes.data);
      if (awardsRes.data) setAwards(awardsRes.data);
      if (researchRes.data) setResearchPublications(researchRes.data);
      if (expertiseRes.data) setExpertiseList(expertiseRes.data);
      if (currentExpRes.data) setCurrentExperience(currentExpRes.data);
      if (previousExpRes.data) setPreviousExperience(previousExpRes.data);
    } catch (error) {
      console.error('Error loading doctor data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSimilarDoctors(specializationId: string) {
    try {
      const { data: similarDocIds } = await supabase
        .from('doctor_specializations')
        .select('doctor_id, is_primary, specializations(name)')
        .eq('specialization_id', specializationId)
        .eq('is_primary', true)
        .neq('doctor_id', doctorId)
        .limit(3);

      if (similarDocIds && similarDocIds.length > 0) {
        const ids = similarDocIds.map((d: any) => d.doctor_id);
        const { data: doctors } = await supabase
          .from('doctors')
          .select('*')
          .in('id', ids);

        if (doctors) {
          setSimilarDoctors(doctors);
          const map = new Map<string, string>();
          similarDocIds.forEach((ds: any) => {
            if (ds.specializations) {
              map.set(ds.doctor_id, ds.specializations.name);
            }
          });
          setSimilarDocSpecs(map);
        }
      }
    } catch (error) {
      console.error('Error loading similar doctors:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Doctor not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-teal-600 hover:text-teal-700 mb-4 print:hidden"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to listings
          </button>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8">
              <img
                src={doctor.profile_image || 'https://via.placeholder.com/200'}
                alt={doctor.name}
                className="w-48 h-48 rounded-lg object-cover border-4 border-teal-100 shadow-sm"
              />

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800">
                  {doctor.name}
                </h1>
                <p className="text-lg text-gray-600 mt-2">{doctor.title}</p>
                {doctor.designation && (
                  <p className="text-md text-teal-600 font-semibold mt-1">
                    {doctor.designation}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium hover:bg-teal-200 cursor-pointer transition-colors print:cursor-default"
                      onClick={() => onNavigate('category', undefined, { type: 'specialization', value: spec })}
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center text-gray-700">
                    <Clock className="h-5 w-5 mr-2 text-teal-600" />
                    <div>
                      <p className="text-xs text-gray-500">Experience</p>
                      <p className="font-semibold">
                        {doctor.years_of_experience} years
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <CreditCard className="h-5 w-5 mr-2 text-teal-600" />
                    <div>
                      <p className="text-xs text-gray-500">BMDC No</p>
                      <p className="font-semibold">
                        {doctor.bmdc_number || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const mainInstitution = currentExperience.find(exp =>
                      exp.institution &&
                      !exp.institution.toLowerCase().includes('centre') &&
                      !exp.institution.toLowerCase().includes('center') &&
                      !exp.institution.toLowerCase().includes('clinic') &&
                      !exp.institution.toLowerCase().includes('chamber')
                    );

                    return mainInstitution ? (
                      <div className="flex items-center text-gray-700">
                        <MapPin className="h-5 w-5 mr-2 text-teal-600" />
                        <div>
                          <p className="text-xs text-gray-500">Working in</p>
                          <p className="font-semibold text-gray-800">{mainInstitution.institution}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Overview
              </h2>
              <p className="text-gray-700 leading-relaxed">{doctor.overview}</p>
            </section>

            {education.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <GraduationCap className="h-6 w-6 mr-2 text-teal-600" />
                  Qualifications
                </h2>
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div
                      key={edu.id}
                      className="border-l-4 border-teal-600 pl-4"
                    >
                      <h3 className="font-bold text-gray-800">{edu.degree}</h3>
                      <p className="text-gray-600">{edu.institution}</p>
                      <p className="text-sm text-gray-500">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(currentExperience.length > 0 || previousExperience.length > 0) && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Clock className="h-6 w-6 mr-2 text-teal-600" />
                  Work Experiences
                </h2>
                <div className="space-y-4">
                  {currentExperience.map((exp) => (
                    <div key={exp.id} className="border-l-4 border-teal-600 pl-4">
                      <h3
                        className="font-bold text-gray-800 text-lg hover:text-teal-600 cursor-pointer"
                        onClick={() => onNavigate('category', undefined, { type: 'institution', value: exp.institution })}
                      >
                        {exp.institution}
                      </h3>
                      <p className="text-gray-700 mt-1">{exp.position}</p>
                      {exp.department && (
                        <p className="text-sm text-gray-600">{exp.department}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">Since {exp.since_year}</p>
                    </div>
                  ))}
                  {previousExperience.map((exp) => (
                    <div key={exp.id} className="border-l-4 border-gray-400 pl-4">
                      <h3
                        className="font-bold text-gray-800 hover:text-teal-600 cursor-pointer"
                        onClick={() => onNavigate('category', undefined, { type: 'institution', value: exp.institution })}
                      >
                        {exp.institution}
                      </h3>
                      <p className="text-gray-700 mt-1">{exp.position}</p>
                      {exp.department && (
                        <p className="text-sm text-gray-600">{exp.department}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {exp.start_year} - {exp.end_year}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {chambers.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <MapPin className="h-6 w-6 mr-2 text-teal-600" />
                  Chamber Locations & Schedules
                </h2>
                <div className="space-y-6">
                  {chambers.map((chamber) => (
                    <div
                      key={chamber.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className="font-bold text-gray-800 text-lg hover:text-teal-600 cursor-pointer"
                            onClick={() => onNavigate('category', undefined, { type: 'chamber', value: chamber.name })}
                          >
                            {chamber.name}
                          </h3>
                          <p className="text-gray-600 mt-2">
                            {chamber.address}, {chamber.area}, {chamber.city}
                          </p>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${chamber.name}, ${chamber.address}, ${chamber.area}, ${chamber.city}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors ml-4 flex-shrink-0"
                        >
                          <Navigation className="h-4 w-4" />
                          <span className="text-sm font-medium">Get Direction</span>
                        </a>
                      </div>

                      {chamber.schedules.length > 0 && (
                        <div className="mt-4">
                          <p className="font-semibold text-gray-700 mb-2">
                            Available Hours:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {chamber.schedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="flex items-center justify-between bg-teal-50 px-4 py-2 rounded"
                              >
                                <span className="font-medium text-gray-700">
                                  {schedule.day_of_week}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {schedule.start_time.slice(0, 5)} -{' '}
                                  {schedule.end_time.slice(0, 5)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {expertiseList.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Lightbulb className="h-6 w-6 mr-2 text-teal-600" />
                  Field of Concentration
                </h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {expertiseList.map((exp) => (
                    <div key={exp.id} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span
                        className="text-gray-800 hover:text-teal-600 cursor-pointer"
                        onClick={() => onNavigate('category', undefined, { type: 'specialization', value: exp.title })}
                      >
                        {exp.title}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {awards.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Award className="h-6 w-6 mr-2 text-teal-600" />
                  Awards & Recognition
                </h2>
                <div className="space-y-4">
                  {awards.map((award) => (
                    <div
                      key={award.id}
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg"
                    >
                      <h3 className="font-bold text-gray-800">{award.title}</h3>
                      <p className="text-gray-600">{award.organization}</p>
                      <p className="text-sm text-gray-500">{award.year}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {researchPublications.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-teal-600" />
                  Research & Publications
                </h2>
                <div className="space-y-4">
                  {researchPublications.map((pub) => (
                    <div
                      key={pub.id}
                      className="border-l-4 border-blue-600 pl-4 py-2"
                    >
                      <h3 className="font-bold text-gray-800">{pub.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{pub.authors}</p>
                      <p className="text-sm text-gray-600">
                        {pub.journal} ({pub.year})
                      </p>
                      {pub.link && (
                        <a
                          href={pub.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-teal-600 hover:text-teal-700 mt-1 inline-block"
                        >
                          View Publication →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8">
            <section className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Consultation Fees
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">New Patient</span>
                  <span className="font-bold text-teal-600">
                    ৳{doctor.fee_new_patient || doctor.consultation_fee}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="text-gray-700">Old Patient</p>
                    <p className="text-xs text-gray-500">(within 6 months)</p>
                  </div>
                  <span className="font-bold text-teal-600">
                    ৳{doctor.fee_old_patient || doctor.consultation_fee}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-gray-700">Report Checking</p>
                    <p className="text-xs text-gray-500">(after 3 days)</p>
                  </div>
                  <span className="font-bold text-teal-600">
                    ৳{doctor.fee_report_checking || doctor.consultation_fee}
                  </span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Phone className="h-5 w-5 mr-3 text-teal-600" />
                  <span>{doctor.phone}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="h-5 w-5 mr-3 text-teal-600" />
                  <span className="break-all">{doctor.email}</span>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Share2 className="h-5 w-5 mr-2 text-teal-600" />
                Share Profile
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  {shareSuccess ? 'Link Copied!' : 'Share Link'}
                </button>

                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="w-full flex items-center justify-center px-6 py-3 bg-white border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                </button>
              </div>

              {showQRCode && (
                <div className="mt-6 p-4 bg-white rounded-lg border-2 border-gray-200">
                  <div ref={qrCodeRef} className="flex justify-center mb-4">
                    <QRCodeCanvas
                      value={window.location.href}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600 mb-3">
                    Scan to view profile
                  </p>
                  <button
                    onClick={downloadQRCode}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-600 mt-4 text-center leading-relaxed">
                Share this profile with patients, colleagues, or on social media. Print for offline use.
              </p>
            </section>

            {similarDoctors.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6 print:hidden">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Similar Doctors
                </h3>
                <div className="space-y-4">
                  {similarDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onNavigate('doctor', doc.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={
                            doc.profile_image ||
                            'https://via.placeholder.com/60'
                          }
                          alt={doc.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">
                            {doc.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {similarDocSpecs.get(doc.id)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {doc.years_of_experience} years exp.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
