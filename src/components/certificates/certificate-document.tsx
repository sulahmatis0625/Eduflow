import { EduflowLogo } from "@/components/certificates/eduflow-logo";
import { formatDate } from "@/lib/utils";

export type CertificateDocumentData = {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  grade: number;
  issuedAt: Date | string;
};

/** On-screen certificate layout (view without download). */
export function CertificateDocument({ data }: { data: CertificateDocumentData }) {
  const issued =
    data.issuedAt instanceof Date
      ? data.issuedAt
      : new Date(data.issuedAt);

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[842/595] bg-[#fafaf8] text-[#1a1f29] rounded-sm shadow-2xl overflow-hidden border-[3px] border-[#c09e40]">
      <div className="absolute inset-[8px] border border-[#0db8a6]/70 pointer-events-none" />

      <div className="relative h-full flex flex-col items-center justify-between px-8 py-7 sm:px-14 sm:py-10">
        <div className="flex flex-col items-center gap-3">
          <EduflowLogo size={44} showWordmark />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
            Certificate of Completion
          </h1>
        </div>

        <div className="flex flex-col items-center text-center gap-2 max-w-2xl">
          <p className="text-sm text-[#5a6170]">This is to certify that</p>
          <p className="text-2xl sm:text-3xl font-serif italic font-semibold">
            {data.studentName || "Student"}
          </p>
          <p className="text-sm text-[#5a6170] mt-1">
            has successfully completed the course
          </p>
          <p className="text-lg sm:text-xl font-bold text-[#0db8a6] mt-1">
            {data.courseTitle}
          </p>
        </div>

        <div className="w-full max-w-2xl grid grid-cols-3 gap-4 text-left">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#5a6170]">
              Instructor
            </p>
            <p className="text-sm font-semibold truncate">
              {data.instructorName || "EduFlow Instructor"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#5a6170]">
              Grade
            </p>
            <p className="text-sm font-semibold">{Math.round(data.grade)}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#5a6170]">
              Issued
            </p>
            <p className="text-sm font-semibold">{formatDate(issued)}</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-[#5a6170] font-mono">
            Certificate ID: {data.certificateId}
          </p>
        </div>
      </div>
    </div>
  );
}
