const fs = require('fs');
let code = fs.readFileSync('/home/j0k3r/Desktop/workspaces/frontend/src/app/workspace/staffs/add-staff-form.tsx', 'utf8');

// Update createStaffMutation
code = code.replace(
  'sourceOfHire: firstSlideData.sourceOfHire || null,',
  'sourceOfHire: firstSlideData.sourceOfHire || null,\n      workExperience,\n      educationDetails,\n      dependentDetails,'
);

// Update saveFirstSlide
code = code.replace(
  'sourceOfHire: firstSlideData.sourceOfHire || null,',
  'sourceOfHire: firstSlideData.sourceOfHire || null,\n        workExperience,\n        educationDetails,\n        dependentDetails,'
);

fs.writeFileSync('/home/j0k3r/Desktop/workspaces/frontend/src/app/workspace/staffs/add-staff-form.tsx', code);
