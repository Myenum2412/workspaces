const fs = require('fs');
let code = fs.readFileSync('/home/j0k3r/Desktop/workspaces/frontend/src/app/workspace/staffs/staff-detail-modal.tsx', 'utf8');

const updatedHistoryFields = `
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Professional & Personal Details</span>
                  
                  {/* Work Experience */}
                  <div className="rounded-2xl border bg-white p-4">
                    <p className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2"><BriefcaseIcon className="h-4 w-4" /> Work Experience</p>
                    {staff.workExperience?.length > 0 ? staff.workExperience.map((exp: any, i: number) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <p className="text-xs font-semibold">{exp.company} - {exp.title}</p>
                        <p className="text-[10px] text-muted-foreground">{exp.from} to {exp.to}</p>
                      </div>
                    )) : <p className="text-xs text-muted-foreground italic">No work experience added.</p>}
                  </div>

                  {/* Education Details */}
                  <div className="rounded-2xl border bg-white p-4">
                    <p className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Education Details</p>
                    {staff.educationDetails?.length > 0 ? staff.educationDetails.map((edu: any, i: number) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <p className="text-xs font-semibold">{edu.institute}</p>
                        <p className="text-[10px] text-muted-foreground">{edu.degree} - {edu.specialization}</p>
                      </div>
                    )) : <p className="text-xs text-muted-foreground italic">No education details added.</p>}
                  </div>

                  {/* Dependents */}
                  <div className="rounded-2xl border bg-white p-4">
                    <p className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2"><UserIcon className="h-4 w-4" /> Dependents</p>
                    {staff.dependentDetails?.length > 0 ? staff.dependentDetails.map((dep: any, i: number) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <p className="text-xs font-semibold">{dep.name}</p>
                        <p className="text-[10px] text-muted-foreground">{dep.relationship} • {dep.dob}</p>
                      </div>
                    )) : <p className="text-xs text-muted-foreground italic">No dependents added.</p>}
                  </div>
                </div>
`;

code = code.replace(
  /\{historyFields\.map\(\(field\) => \([\s\S]*?\)\)\}/,
  updatedHistoryFields
);

// We need to import UserIcon
code = code.replace(
  'History,',
  'History,\n  UserIcon,'
);

fs.writeFileSync('/home/j0k3r/Desktop/workspaces/frontend/src/app/workspace/staffs/staff-detail-modal.tsx', code);
