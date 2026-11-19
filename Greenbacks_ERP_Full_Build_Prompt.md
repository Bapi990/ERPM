# Full ERP Platform — Product Requirements & Build Prompt

## Instructions for the Development Agent

Build a production-ready, modular **Enterprise Resource Planning (ERP) platform** with an integrated **HRMS, CRM, Billing & Invoicing system**, and a permission-controlled administration system.

This document is the implementation brief. Follow it as the source of truth. Do not create only a static UI or a demo with fake data. Build the frontend, backend, database models, authentication, permissions, APIs, validations, workflows, and real-time updates so that the modules work together as one application.

Before implementation:
1. Inspect the existing repository and preserve any working code, configuration, and assets.
2. Prepare a clear implementation plan and database relationship map.
3. Create the application in logical phases, but keep the architecture unified from the beginning.
4. Use realistic seed/demo data only in a development environment. Clearly label demo data and never mix it with production records.
5. Do not leave non-functional buttons, fake charts, placeholder forms, dead links, or frontend-only permissions.
6. If an external service is not configured (email, SMS, WhatsApp, payment gateway, cloud storage, etc.), build the integration interface and configuration screen, show its status as **Not Configured**, and explain what credentials are required. Never pretend that a message or payment was sent successfully when it was not.
7. Make the entire platform responsive and usable on desktop, tablet, and mobile.

---

# 1. Product Vision

Create one centralized ERP platform where the company can manage employees, attendance, payroll, customers, leads, sales, quotations, invoices, payments, expenses, reports, and internal operations.

The platform must have:

- One common login page for every user.
- One common application shell and design system.
- One centralized user, role, and permission system.
- Separate role-based dashboards and menus generated from permissions.
- Connected HRMS, CRM, Billing, and supporting ERP modules.
- Real-time updates across authorized dashboards and pages.
- Secure, server-side permission enforcement on every protected API.
- Complete activity history and audit logs for important actions.

**Important:** Do not build separate applications for Super Admin, Sub-Admin, Manager, HR, and Employee. Build one application. The signed-in user's permissions determine which menus, data, buttons, pages, and actions are available.

## 1.1 Main Technology Stack

### Frontend
- React with TypeScript.
- Vite for development and production builds.
- React Router for navigation.
- A consistent component library and reusable design system. Use Tailwind CSS or an equivalent maintainable styling system.
- TanStack Query (or an equivalent) for API data fetching, caching, and invalidation.
- React Hook Form with schema validation (Zod or equivalent).
- WebSocket client for real-time events.
- Chart library for dashboards and reports.

### Backend
- Python with Django.
- Django REST Framework for APIs.
- PostgreSQL as the primary production database.
- Django Channels for WebSocket communication.
- Redis for Channels, caching, and background task coordination.
- Celery for background jobs such as reminders, scheduled reports, payroll processing tasks, and notification delivery.
- JWT-based authentication with secure token handling, refresh and logout support. Prefer secure, HttpOnly cookies for browser sessions where practical; protect against CSRF and XSS.

### Engineering Requirements
- Use environment variables for secrets and environment-specific settings.
- Never hardcode passwords, API keys, database credentials, secret keys, or payment credentials.
- Use database migrations for every schema change.
- Use transactions for financial and payroll operations.
- Add pagination, filtering, sorting, search, and API validation.
- Use structured logging and meaningful API error responses.
- Create automated tests for authentication, permissions, calculations, and workflows.
- Provide a `.env.example` file with placeholder values only.

---

# 2. Application Architecture and Unified Login

## 2.1 One Login Page

Create one professional login page for all users. Every role must use the same URL and login form.

Login fields:
- Work email, username, or registered mobile number (based on enabled company settings).
- Password.
- Show/hide password control.
- Remember me option, where secure and appropriate.
- Forgot password flow with a secure, time-limited reset process.
- Optional two-factor authentication (2FA), configurable by Super Admin.
- Clear validation and login error messages.
- Account lockout/rate limiting after repeated failed attempts.

After successful login:
1. The backend identifies the user and loads the user's active roles, permissions, and data scope.
2. The application opens the same ERP shell for everyone.
3. The sidebar, dashboard widgets, action buttons, pages, and data are generated from the user's effective permissions.
4. Users must never see a menu item or action that they are not authorized to use.
5. If a user has more than one assigned role, provide a role/workspace switcher only for roles that have actually been assigned to that user. Switching role must not grant additional permissions.
6. Redirect users to their authorized default dashboard. If no dashboard permission exists, show a clear access message rather than a broken page.

## 2.2 User Account Management

Super Admin and authorized administrators can:
- Create, invite, activate, suspend, deactivate, and archive user accounts.
- Link a user account to an employee record, manager, department, branch, and reporting structure.
- Assign one or more roles.
- Reset credentials or send a password reset invitation.
- Require password change on first login.
- Enable or disable 2FA requirements.
- View last login, active sessions, and account status.
- Revoke sessions when a user leaves the organization or a device is compromised.

An employee record and login account should be linked but stored as separate entities so employee information can exist before an account is activated.

---

# 3. Role-Based Access Control (RBAC)

Build a complete, dynamic **Role & Permission Management** area inside the Admin Panel.

## 3.1 Initial Roles

Create these default roles. They must be editable and additional roles must be configurable:

1. **Super Admin** — unrestricted system administration, organization-wide configuration, user and role management, module activation, security, and audit visibility.
2. **Sub-Admin** — access only to the modules, branches, departments, records, and actions specifically assigned by Super Admin.
3. **HR Manager / HR** — employee records, recruitment (if enabled), attendance, leave, holidays, shifts, payroll preparation, and HR reports according to assigned permissions.
4. **Manager** — access to assigned team members, team attendance, leave approvals, tasks, CRM records, sales pipeline, and team reports as permitted.
5. **Employee** — access to own profile, own attendance, own leave, own holiday calendar, own payslips, own assigned tasks, and permitted self-service features.
6. **Accounts / Finance** — billing, invoices, payments, expenses, tax settings, and financial reports according to permissions.
7. **Sales / CRM Executive** — assigned leads, customers, opportunities, quotations, follow-ups, and permitted sales reports.

Do not assume that every organization will use every default role. Super Admin must be able to create custom roles, duplicate roles, rename roles, and deactivate roles that are not assigned to active users.

## 3.2 Permission Structure

Permissions must be granular and stored in the database. Use a permission matrix with at least these action types:

- View
- Create
- Edit
- Delete / Archive
- Approve
- Reject
- Assign / Reassign
- Export / Download
- Print
- Import
- Configure
- View Sensitive Data
- Change Status
- Process / Finalize

Organize permissions by module, page, feature, and action. For example:

- HRMS → Employees → View / Create / Edit / Archive / Export.
- HRMS → Attendance → View Own / View Team / View All / Correct / Approve Correction.
- HRMS → Payroll → View Own Payslip / View Team Payroll / View All Payroll / Create Payroll / Edit Salary Structure / Process Payroll / Approve Payroll / Release Payslips.
- CRM → Leads → View Assigned / View Team / View All / Create / Edit / Delete / Assign / Export.
- Billing → Invoices → View / Create / Edit Draft / Approve / Issue / Cancel / Download / Send.
- Admin → Roles → View / Create / Edit / Assign / Delete.

Include **record-level/data-scope permissions**:
- Own records only.
- Assigned records only.
- Own team or reporting employees.
- Selected department(s).
- Selected branch(es).
- Organization-wide records.

Permissions must support field-level restrictions for sensitive information such as salary, bank details, personal identity documents, and tax information.

## 3.3 Permission Matrix UI

Create an advanced, easy-to-use permission editor:
- Table layout: modules and submodules in rows; action permissions in columns.
- Expand/collapse module groups.
- Select all / deselect all at module level.
- Copy permissions from an existing role.
- Search permissions.
- Display a clear summary of selected permissions.
- Assign data scope separately from action permission.
- Save changes with confirmation.
- Show who changed a role and when.
- Warn before removing permissions from a role currently assigned to users.

## 3.4 Permission Enforcement — Critical

Permissions must be checked in **both** places:

1. **Frontend:** hide or disable unauthorized menus, routes, widgets, fields, and action buttons.
2. **Backend:** enforce permission and data-scope checks on every API request, object lookup, export, download, WebSocket subscription, and sensitive action.

Frontend hiding is not security. A user must not gain access by typing a URL, editing a request, calling an API directly, or changing browser state.

Return HTTP 403 for authenticated users who lack permission. Return HTTP 401 for unauthenticated requests. Never return another employee's, customer's, or branch's data merely because the user knows an ID.

## 3.5 Permission Examples

- Employee A can see only Employee A's attendance, leave, documents, salary information, and payslips.
- Manager A can see only team records within the assigned reporting structure and permitted departments/branches.
- HR can view employee and attendance information according to HR permissions. Salary access must be a separate sensitive permission.
- HR may prepare salary structures for employees only when granted the salary-edit permission.
- HR must not automatically gain permission to approve or release their own salary change or payroll record.
- A Manager may approve team leave without viewing salary or bank details.
- Accounts may process invoices without accessing confidential HR records.
- Sub-Admin access must remain limited to the assigned modules and data scope.

---

# 4. Common ERP Application Layout and Design System

Build a polished, modern, professional business application. The interface should feel like a high-quality commercial SaaS ERP, not a basic admin template.

## 4.1 Main Layout

Use one shared application shell containing:
- Collapsible left sidebar.
- Company logo and organization name.
- Role-aware navigation.
- Top header with page title and breadcrumbs.
- Global search.
- Real-time notification bell with unread count.
- Quick-create menu based on permissions.
- User profile menu, role/workspace switcher (if applicable), account settings, and logout.
- Main content area.
- Optional right-side activity panel where useful.

The sidebar must be generated dynamically based on permissions. Suggested module groups:

1. Overview
2. HRMS
3. CRM & Sales
4. Billing & Finance
5. Inventory & Purchase (configurable extension)
6. Projects & Tasks
7. Reports & Analytics
8. Documents
9. Notifications
10. Administration / Settings

Only show modules that are enabled and authorized for the logged-in user.

## 4.2 Visual Style

- Use a clean light theme by default with a carefully chosen professional primary color, neutral backgrounds, readable text, and accessible contrast.
- Use a restrained palette. Do not use excessive gradients, glowing effects, or too many colors.
- Use consistent spacing, typography, buttons, cards, form controls, tables, dialogs, and status badges.
- Use icons consistently and pair unclear icons with labels.
- Build desktop-first but ensure full mobile responsiveness.
- Make tables usable on small screens through responsive columns, horizontal scrolling where necessary, or a mobile card layout.
- Include loading skeletons, empty states, error states, confirmation dialogs, toast feedback, and helpful validation messages.
- Provide light/dark theme support if practical, with the light theme as the default.
- Make all important workflows keyboard accessible.

## 4.3 Reusable UI Components

Create reusable components for:
- Data table with pagination, sorting, filters, column visibility, row actions, and export.
- Searchable dropdown and multi-select.
- Date range picker.
- Calendar and event modal.
- Form sections and validation messages.
- File uploader with preview and progress.
- Confirmation dialog.
- Approval timeline.
- Status badge.
- KPI cards and charts.
- Activity timeline.
- Notification dropdown and notification centre.
- Permission-aware action button.
- Empty, loading, and error states.

Every add/edit/delete/view action must work. Use confirmation for destructive actions and prefer archive/soft delete for important business records.

---

# 5. HRMS Module — Human Resource Management System

Build a complete HRMS with employee self-service, HR operations, manager approvals, attendance, leave, holidays, shifts, payroll, payslips, and reports.

## 5.1 HRMS Dashboard

### HR Dashboard
Show permitted organization-wide KPIs:
- Total active employees.
- New joiners this month.
- Employees on leave today.
- Present, absent, late, and work-from-home counts today.
- Attendance percentage.
- Pending leave requests.
- Pending attendance corrections.
- Payroll status and upcoming payroll date.
- Upcoming birthdays and work anniversaries (subject to company privacy settings).
- Department-wise employee distribution.
- Attendance trend and headcount trend.
- Recent HR activity.

### Manager Dashboard
Show only the manager's authorized team data:
- Team present/absent/late/on leave today.
- Pending team leave requests.
- Pending attendance corrections.
- Team task summary.
- Team birthdays/anniversaries if enabled.
- Team attendance trend.

### Employee Dashboard
Show only the logged-in employee's data:
- Today's attendance status.
- Check-in and check-out time.
- Check-in/check-out camera action.
- Total hours worked and break duration.
- Monthly attendance summary.
- Leave balance and leave status.
- Upcoming holidays and weekly offs.
- Latest payslip and salary summary, if permitted.
- Assigned tasks and announcements.
- Personal notifications.

## 5.2 Employee Management

Create an employee directory with searchable, filterable table and employee profile pages.

Employee profile sections:
- Personal information.
- Contact information and emergency contact.
- Employee ID and employment status.
- Photograph/profile image.
- Department, designation, branch, location, manager, and reporting hierarchy.
- Date of joining, probation end date, confirmation date, and employment type.
- Work schedule, shift, weekly off pattern, and work location.
- Salary structure (sensitive permission required).
- Bank/payment information (highly restricted permission).
- Statutory/tax details as applicable and configurable for the organization's jurisdiction.
- Identity and employment documents with restricted access.
- Education and experience details.
- Skills and certifications.
- Leave balance.
- Attendance history.
- Payroll and payslip history (restricted).
- Performance review history (optional module).
- Assets assigned (optional module).
- Notes and activity timeline.

Employee directory features:
- Add employee.
- Edit employee.
- View full profile.
- Activate/deactivate employee.
- Archive employee with exit reason and date.
- Import/export employees using validated CSV/XLSX templates.
- Generate employee ID automatically using configurable format.
- Bulk assign department, designation, manager, branch, or shift when authorized.
- Prevent duplicate employee IDs and configured duplicate identity/contact records.

Employee lifecycle:
- Candidate/offer (optional recruitment module).
- Pre-joining.
- Onboarding checklist.
- Active employment.
- Probation.
- Confirmed.
- Notice period.
- Resigned/terminated.
- Exit checklist and final settlement (configurable).

## 5.3 Camera-Based Attendance — Check-In and Check-Out

Build a camera-assisted attendance workflow accessible from the Employee Dashboard and attendance page.

### Employee Check-In
1. Employee logs in using their individual account.
2. The employee presses **Check In**.
3. Show a clear explanation and request browser camera permission.
4. Open the device camera using a secure browser API.
5. Display a live camera preview.
6. Employee captures a selfie and confirms it.
7. Capture the server timestamp when the attendance event is accepted. Do not trust the device clock as the authoritative time.
8. Save the attendance event and selfie reference securely.
9. Display successful check-in time and current attendance status.
10. Send a real-time update to permitted HR and Manager dashboards.

### Employee Check-Out
Use the same controlled process with a **Check Out** action. Save check-out time, optional selfie, worked duration, and status. Prevent duplicate check-in or check-out events unless an authorized correction workflow is used.

### Attendance Requirements
- Camera permission must be requested only when needed and must be explained to the user.
- Use HTTPS in production for camera access.
- Allow configurable camera requirement: mandatory, optional, or disabled by organization policy.
- Provide a fallback attendance correction request if the camera is unavailable, subject to HR/Manager approval.
- Store image files in secure private storage, not in a public folder. Use authorized, expiring access URLs for viewing.
- Record timestamp, employee ID, event type, device/browser metadata where lawful, source, and optional location/geofence information if enabled.
- If location is enabled, request it transparently and only for attendance purposes. Make geofencing configurable by branch/work location.
- Do not claim that a selfie alone proves identity or prevents all spoofing. Face matching/liveness checks may be an optional separately configured integration and must be assessed for legal, privacy, and consent requirements.
- Include retention rules for attendance images and provide authorized deletion/retention controls.

### Attendance Statuses
- Present.
- Absent.
- Half Day.
- Late.
- Early Leave.
- Work From Home.
- On Approved Leave.
- Holiday.
- Weekly Off.
- On Duty / Field Work.
- Pending Correction.

### Attendance Table
Columns:
- Date.
- Employee ID.
- Employee name.
- Department.
- Shift.
- Check-in.
- Check-in image indicator.
- Check-out.
- Check-out image indicator.
- Total working hours.
- Break duration.
- Late duration.
- Overtime.
- Attendance status.
- Approval/correction status.
- Actions.

Filters:
- Date/date range.
- Employee.
- Department.
- Manager.
- Branch.
- Shift.
- Attendance status.
- Late/early/absent.

Actions based on permission:
- View.
- Add manual entry.
- Correct attendance.
- Approve/reject correction.
- Export.
- View attendance image.
- View audit history.

All manual changes must capture the original value, new value, reason, changed by, approved by (if applicable), and timestamp.

## 5.4 Shifts, Working Hours, Breaks, and Overtime

Create configurable shift management:
- Shift name and code.
- Start and end time.
- Grace period.
- Break schedules and durations.
- Full-day/half-day thresholds.
- Late arrival and early departure rules.
- Overtime eligibility and calculation policy.
- Night shift and cross-midnight support.
- Applicable branch, department, and employee groups.
- Effective start/end dates.

Allow authorized HR users to assign shifts individually or in bulk. Show employees their current shift and schedule.

Overtime must be calculated only according to an organization-approved policy. Do not automatically treat all extra time as payable overtime.

## 5.5 Leave Management

Create a complete leave management system.

Leave types must be configurable, for example:
- Casual Leave.
- Sick Leave.
- Earned/Annual Leave.
- Unpaid Leave.
- Compensatory Off.
- Maternity/Paternity or other statutory leave where applicable.
- Work From Home / On Duty, if managed through the leave workflow.

Features:
- Leave policy by employee type, department, branch, or tenure.
- Annual entitlement and monthly accrual.
- Carry-forward and expiry rules.
- Half-day and hourly leave support if enabled.
- Leave balance calculation.
- Leave application with date range, leave type, reason, and optional attachment.
- Conflict checks against holidays, weekly offs, shifts, and existing leave.
- Multi-level approval: Manager → HR, or a configurable approval chain.
- Approve/reject/request changes with comments.
- Cancellation and withdrawal workflow.
- Leave calendar and employee leave history.
- Team availability view for managers.
- Notifications to employee, manager, and HR.

Never allow an unauthorized user to approve their own leave. Add configurable delegation for approvers who are unavailable.

## 5.6 Holiday and Weekly-Off Management

Create a dedicated **Holiday Management** page with both a calendar and a table.

### Holiday Calendar
- Monthly, weekly, and agenda/list views.
- Visually distinguish public/company holidays, optional holidays, weekly offs, and special working days.
- Filter by branch, location, department, and employee group.
- Show holiday name, date, type, and applicable locations/groups.
- Open an event to view full details.

### Holiday Table
Columns:
- Holiday name.
- Date.
- Day.
- Holiday type.
- Branch/location.
- Applicable departments or employee groups.
- Paid/unpaid classification, where relevant.
- Description.
- Status.
- Created by.
- Actions.

### Required Buttons
- **Add Holiday** button.
- **View** button/action.
- **Edit** button/action.
- **Delete/Archive** button/action.
- Import/export where authorized.

The Add/Edit Holiday form must include:
- Holiday name.
- Date or date range (if supported).
- Holiday type.
- Branch/location.
- Applicable department(s) or employee group(s).
- Paid/unpaid classification.
- Description/notes.
- Active/inactive status.

Show a confirmation dialog before deleting or archiving. Prevent accidental deletion of a holiday already used in a finalized payroll period; use a controlled correction process instead.

### Weekly-Off Configuration
- Configure weekly off by organization, branch, department, shift, or employee.
- Support one or more weekly off days and rotating weekly offs.
- Support special working days and compensatory-off rules.
- Show weekly offs in the calendar.

## 5.7 Payroll and Salary Management

Build an advanced payroll module connected to employee profiles, attendance, leave, holidays, shifts, and company payroll policies.

### Salary Structure Setup
Authorized HR/Payroll users can create and assign salary structures.

Salary structure fields:
- Employee.
- Effective from date.
- Salary frequency (monthly, weekly, daily, hourly, where enabled).
- Basic salary.
- House Rent Allowance (HRA), if applicable.
- Conveyance/transport allowance.
- Medical allowance, if applicable.
- Special allowance.
- Other earnings.
- Incentives/commission.
- Overtime payable.
- Employer contributions (tracked separately from employee take-home pay).
- Employee deductions.
- Advance/loan recovery.
- Other deductions.
- Gross earnings.
- Total deductions.
- Net salary.

Allow salary structures to be created from templates and assigned to multiple employees where appropriate. Maintain version history and effective dates. Do not overwrite previous payroll history when salary changes.

### Role-Based Salary Access
- Employee: may view their own approved salary summary and payslips only when the corresponding self-service permissions are enabled. Employee cannot edit or approve their own salary.
- HR/Payroll: may view or edit salary structures only with explicit permissions and assigned data scope.
- Manager: no salary access by default. It must be separately granted.
- Accounts: may access payroll totals or payment data only as explicitly permitted.
- Super Admin: can grant or revoke sensitive salary permissions and review audit history.
- A person must not approve their own salary change or their own payroll run. Use maker-checker approval for sensitive payroll actions.

### Attendance-Linked Payroll Calculation
Payroll must calculate employee pay using:
- Employee salary structure and effective date.
- Payroll period.
- Assigned shift and scheduled working days.
- Approved attendance records.
- Approved paid and unpaid leave.
- Company holidays.
- Weekly offs.
- Half days and late/early rules, if the organization has an approved deduction policy.
- Overtime and incentives, if eligible.
- Loans/advances and authorized recoveries.
- Configured statutory and tax deductions.

**Critical payroll policy rule:** Public holidays and scheduled weekly offs must not automatically be treated as unpaid absence. The system must distinguish paid holidays/weekly offs from unpaid leave and unauthorized absence. Use the organization's approved payroll policy and clearly show the calculation. Do not silently deduct salary for a holiday or weekly off.

Provide configurable payroll divisor policies, such as calendar-day basis or scheduled-working-day basis, with an effective date and approval. Show the divisor and formula used for every employee. Avoid mixing divisor policies within one finalized payroll run.

Example calculation logic (illustrative only; use company policy and jurisdiction-specific rules):
- Scheduled working days = days employee was expected to work in the payroll period, excluding approved weekly offs and applicable paid holidays.
- Payable days = scheduled working days minus unpaid absence/LOP days, with paid leave and eligible attendance adjustments treated according to policy.
- Gross payable = salary components adjusted using the configured divisor and payable days, plus eligible earnings.
- Net pay = gross payable minus employee deductions and approved recoveries.

Do not assume every salary component is prorated in the same way. Allow each component to be configured as fixed, attendance-prorated, variable, or excluded from LOP calculation.

### Payroll Workflow
1. HR configures the payroll period and selects employees/branches.
2. System imports the approved attendance, leave, holidays, weekly offs, shifts, salary versions, and approved variable earnings.
3. System identifies missing attendance, unapproved leave, incomplete employee bank details, and other exceptions.
4. Payroll is calculated in draft mode.
5. HR reviews employee-wise calculations and exception warnings.
6. HR can correct source records through their proper workflows; finalized payroll must not be silently overwritten.
7. Authorized reviewer approves the payroll.
8. Authorized payroll user finalizes the run.
9. Payslips are generated and released to employees according to permissions and company policy.
10. Payment status can be recorded or imported from an authorized payment process. Do not claim bank transfer completion without a verified integration or recorded confirmation.

### Payroll Screens
- Payroll Dashboard.
- Salary Structures.
- Employee Salary Assignments.
- Payroll Periods.
- Run Payroll.
- Payroll Preview.
- Payroll Exceptions.
- Approval Queue.
- Finalized Payroll.
- Payslips.
- Salary Revision History.
- Payroll Reports.
- Payroll Settings.

### Payroll Table
Columns:
- Employee ID.
- Employee name.
- Department/designation.
- Payroll period.
- Gross salary.
- Payable days.
- Paid leave days.
- Unpaid leave/LOP days.
- Holiday/weekly-off days (display separately; do not treat them as LOP by default).
- Earnings.
- Deductions.
- Net salary.
- Payroll status.
- Approval status.
- Actions.

### Employee Payslip
Generate a professional downloadable PDF payslip containing:
- Company identity and address.
- Employee name and ID.
- Department and designation.
- Pay period and payment date.
- Attendance/payable days summary.
- Paid leave and unpaid leave/LOP summary.
- Holiday and weekly-off summary where relevant.
- Earnings itemized by component.
- Deductions itemized by component.
- Gross earnings.
- Total deductions.
- Net salary payable.
- Authorized company note/signature area.

Employee self-service must allow the employee to view and download only their own released payslips. Add a clear breakdown explaining **what was deducted and why**.

### Payroll Controls
- Payroll lock after finalization.
- Reopen/correction only with a high-level permission, reason, and audit trail.
- Maker-checker approval.
- Duplicate payroll prevention.
- Effective-dated salary changes.
- Payroll calculation preview before finalization.
- Employee-wise and organization-wise totals.
- Reconciliation report.
- Export to approved accounting/bank formats where configured.
- No silent edits to finalized payslips.

## 5.8 Employee Self-Service Portal
Employees should be able to use the same ERP login to:
- View/edit permitted personal profile fields.
- View attendance and check-in/out.
- Submit attendance correction requests.
- Apply for leave and track status.
- View holiday calendar and weekly offs.
- View assigned shifts and work schedule.
- View and download released payslips.
- View salary summary if permitted.
- Upload permitted documents.
- View announcements and company policies.
- View their assigned tasks.
- Raise HR/helpdesk requests if enabled.

Employees must not edit confidential or approved records such as salary, payroll calculations, attendance history, leave approval, or bank details unless a specific secure request workflow is provided.

## 5.9 HR Reports
- Daily attendance report.
- Monthly attendance report.
- Late arrival and early departure report.
- Absence report.
- Leave balance and leave utilization report.
- Holiday calendar report.
- Overtime report.
- Employee headcount report.
- Department/branch employee report.
- Payroll summary and payroll register.
- LOP and deduction report.
- Salary revision report.
- Employee joining and exit report.

All reports must follow data-scope and sensitive-data permissions.

---

# 6. CRM Module — Customer Relationship Management

Build a complete CRM connected to Sales, Quotations, Billing, and customer communication history.

## 6.1 CRM Dashboard
Show KPIs according to the user's data scope:
- Total leads.
- New leads this month.
- Leads by source.
- Leads by status.
- Open opportunities.
- Pipeline value.
- Won and lost deals.
- Conversion rate.
- Follow-ups due today.
- Overdue follow-ups.
- Salesperson performance.
- Recent customer activity.

## 6.2 Lead Management
Lead fields:
- Lead ID (auto-generated).
- Lead name/contact person.
- Company/business name.
- Mobile number.
- Email.
- Website.
- Address, city, state, country, and postal code.
- Lead source (website, referral, phone, social media, campaign, walk-in, etc.).
- Interested product/service.
- Estimated value.
- Lead stage/status.
- Priority.
- Assigned salesperson.
- Department/branch.
- Expected close date.
- Notes and attachments.
- Created date and last activity.

Features:
- Add/edit/view leads.
- Import leads with duplicate detection.
- Assign/reassign leads.
- Bulk update permitted fields.
- Lead tags and custom fields.
- Convert qualified lead to customer/contact and opportunity without losing history.
- Lead source and conversion analytics.
- Archive/delete with permission and audit trail.

## 6.3 Customer and Contact Management
Customer profile:
- Customer code.
- Individual/company type.
- Customer/business name.
- Contact persons.
- Phone and email.
- Billing address.
- Shipping/service address.
- Tax registration details (such as GSTIN where relevant).
- Country and place-of-supply details where relevant.
- Customer category and tags.
- Credit limit and payment terms (restricted permission).
- Assigned account manager.
- Notes, attachments, and communication history.
- Linked quotations, orders, invoices, payments, and support tickets.

Provide customer search, filters, customer statement, outstanding balance, and activity timeline.

## 6.4 Sales Pipeline and Opportunities
- Customizable pipeline stages.
- Kanban board and table view.
- Opportunity name and customer.
- Estimated deal value.
- Probability.
- Expected close date.
- Assigned owner/team.
- Next follow-up date.
- Products/services of interest.
- Competitor and lost reason.
- Stage change history.
- Won/lost status.

Allow drag-and-drop stage changes only where the user has permission. Log every stage transition.

## 6.5 Follow-Ups, Activities, and Communication
Create activity types:
- Call.
- Meeting.
- Email.
- WhatsApp/contact note (only when integration is configured).
- Task.
- Site visit.
- Follow-up reminder.

Each activity should have:
- Related lead/customer/opportunity.
- Assigned user.
- Date and time.
- Due date.
- Status.
- Notes/outcome.
- Reminder setting.
- Attachment where permitted.

Provide Today's Follow-Ups and Overdue Follow-Ups views. Send in-app notifications and optional email/SMS reminders through configured integrations.

## 6.6 CRM Tasks and Team Management
- Create tasks and assign to sales staff.
- Set priority, due date, status, and checklist.
- Add comments and attachments.
- Track task completion.
- Managers can view team task status within their data scope.
- Real-time updates when tasks are assigned, changed, completed, or overdue.

## 6.7 CRM to Billing Connection
From a qualified lead/opportunity/customer:
- Create a quotation.
- Convert an accepted quotation to an invoice or sales order, according to configuration.
- Carry customer, line items, taxes, terms, and reference IDs into the next record.
- Preserve links between lead → customer → opportunity → quotation → invoice → payment.
- Update opportunity status and value when the linked business transaction is completed.
- Never duplicate customer or transaction data unnecessarily.

---

# 7. Billing and Invoicing Module

Build a full billing system for services and products with estimates, quotations, invoices, payment tracking, expenses, customer balances, and reports.

## 7.1 Billing Dashboard
Show permission-controlled KPIs:
- Total sales this month.
- Invoice amount.
- Amount received.
- Outstanding amount.
- Overdue invoices.
- Draft quotations.
- Accepted quotations.
- Recent payments.
- Revenue trend.
- Customer-wise outstanding.
- Tax summary where configured.

## 7.2 Product and Service Master
Fields:
- Item/service code or SKU.
- Name.
- Description.
- Product or service type.
- Category.
- Unit of measurement.
- Unit price/selling price.
- Purchase cost (restricted permission where needed).
- Tax rate/tax category.
- HSN/SAC or relevant classification.
- Discount eligibility.
- Active/inactive status.
- Optional stock tracking link.

Allow item creation, editing, archive, import/export, and search.

## 7.3 Quotations and Estimates
- Create quotation for a customer or directly from CRM opportunity.
- Auto-generated quotation number using configurable numbering rules.
- Quotation date and validity date.
- Customer and billing details.
- Item/service lines, quantity, rate, discounts, and taxes.
- Subtotal, tax total, discount total, round-off, and grand total.
- Terms and conditions.
- Notes and attachments.
- Draft, sent, accepted, rejected, expired, and converted statuses.
- PDF preview/download.
- Email sending only through a configured provider.
- Convert accepted quotation to invoice without re-entering information.
- Maintain revision history.

## 7.4 Invoices
Invoice fields:
- Invoice number (unique, configurable series and financial year if applicable).
- Invoice date.
- Due date.
- Customer.
- Billing and shipping/service address.
- Customer tax registration number where applicable.
- Place of supply where applicable.
- Line items, description, quantity, unit, rate, discount, and tax.
- Subtotal.
- Discount.
- Tax breakdown.
- Round-off.
- Total invoice value.
- Amount received.
- Outstanding balance.
- Payment terms.
- Notes and terms.
- Linked quotation/opportunity/order.
- Created by and approved/issued by.

Invoice statuses:
- Draft.
- Pending Approval.
- Approved.
- Issued/Sent.
- Partially Paid.
- Paid.
- Overdue.
- Cancelled/Void (with reason and permission).

Required features:
- Create, edit draft, view, approve, issue, print, download PDF, and send invoice (where configured).
- Add payment against invoice.
- Partial payment support.
- Payment due date and overdue calculation.
- Customer ledger and outstanding balance.
- Credit note/debit note workflow where applicable.
- Invoice cancellation with reason and audit trail.
- Prevent unsafe editing of issued invoices; use controlled amendment/credit-note workflows.
- Bulk invoice export and permitted bulk reminders.

## 7.5 Tax and Regional Configuration
Build flexible tax configuration. Do not hardcode one country's rules into the entire application.

For an India deployment, support configurable GST-related fields and calculations such as:
- GSTIN.
- HSN/SAC.
- CGST, SGST, and IGST components.
- Tax-inclusive and tax-exclusive pricing.
- Place of supply.
- Reverse charge indicator where applicable.
- Applicable tax rates configured by authorized users.
- Tax summary reports.

Tax calculations must be tested and validated. Display the calculation clearly. Do not claim that the ERP automatically files GST returns or guarantees legal compliance unless a verified, approved integration is implemented. Keep tax settings effective-dated and auditable.

## 7.6 Payments and Receipts
Payment fields:
- Payment ID.
- Customer.
- Linked invoice(s).
- Payment date.
- Amount.
- Mode (cash, bank transfer, UPI, card, cheque, online gateway, other).
- Transaction/reference number.
- Bank/account reference where authorized.
- Proof/receipt attachment.
- Notes.
- Recorded by.
- Verification status.

Features:
- Full and partial payments.
- Allocate one payment across invoices where permitted.
- Record advance payments/on-account credits.
- Generate receipt PDF.
- Track pending verification.
- Customer payment history.
- Reconciliation report.
- Refund recording with approval and reason.

Do not represent a payment as successful based only on a user clicking a button. Payment gateway status must come from a verified provider response/webhook or an authorized manual confirmation with audit trail.

## 7.7 Expenses and Basic Finance
Include a practical finance section connected to billing:
- Expense categories.
- Expense entry with date, amount, tax, vendor, payment mode, and receipt.
- Expense approval workflow.
- Recurring expenses (optional).
- Cash/bank account master.
- Income and expense summary.
- Customer receivables.
- Vendor payables if purchase/vendor module is enabled.
- Profit/revenue summaries based on recorded data.

Do not label the module as a complete statutory accounting package unless a proper chart of accounts, journal entries, ledger, trial balance, reconciliation, and financial statements are implemented and tested. Keep the architecture extendable for full accounting.

## 7.8 Billing Reports
- Sales register.
- Invoice register.
- Payment register.
- Outstanding receivables.
- Overdue invoice report.
- Customer statement.
- Quotation conversion report.
- Product/service sales report.
- Tax summary.
- Expense report.
- Revenue by month/customer/salesperson/branch.

---

# 8. Supporting ERP Modules

Implement these modules as connected, configurable modules. If implementation must be phased, build the architecture and navigation foundations now and complete the core HRMS, CRM, and Billing workflows first.

## 8.1 Inventory and Purchase (Recommended)
- Product catalogue and SKU.
- Warehouses/locations.
- Stock-in and stock-out.
- Stock adjustments with reasons.
- Stock transfer.
- Low-stock alerts.
- Vendor/supplier master.
- Purchase requests.
- Purchase orders.
- Goods received notes.
- Purchase bills.
- Supplier payments and payables.
- Link sold items to inventory to update stock according to approved business rules.
- Stock movement history and inventory valuation method configuration.

## 8.2 Projects and Tasks
- Create projects with name, code, customer, owner, team, start/end dates, budget, and status.
- Create tasks and subtasks.
- Assign employees and managers.
- Set priority, due date, checklist, attachments, and comments.
- Kanban, list, and calendar views.
- Time tracking if enabled.
- Project progress and overdue task reports.
- Link CRM opportunities and customer invoices where appropriate.

## 8.3 Document Management
- Secure document repository.
- Folders/categories and tags.
- Upload, preview, download, version history, and archive.
- Access rules based on module, role, user, and record ownership.
- Expiry reminders for documents where applicable.
- Private storage and authorized downloads.

## 8.4 Notifications and Announcements
- In-app notification centre.
- Real-time unread count.
- Mark as read/unread.
- Notification preferences.
- Role- and user-targeted announcements.
- Optional email/SMS/WhatsApp notifications through configured integrations.
- Notification history and delivery status where provider data is available.

## 8.5 Helpdesk / Internal Requests (Recommended)
- Employees can create IT, HR, admin, or facilities requests.
- Ticket category, priority, description, attachment, assigned team, status, and SLA.
- Comments and status history.
- Manager/HR/admin assignment rules.
- Employee can view only their own tickets unless granted broader access.

---

# 9. Real-Time Experience — Mandatory Across the ERP

The application must provide a real-time experience across HRMS, CRM, Billing, dashboards, and notifications.

## 9.1 Real-Time Technology
Use Django Channels with WebSockets and Redis. Use authenticated WebSocket connections and verify the user's permissions before joining any group/channel.

Use durable database writes as the source of truth. WebSockets are for delivering change notifications, not as a replacement for database persistence.

## 9.2 Real-Time Events
At minimum, publish events for:

### HRMS
- Employee created/updated/status changed.
- Check-in and check-out submitted.
- Attendance corrected or approved.
- Employee marked present/absent/late.
- Leave applied/approved/rejected/cancelled.
- Holiday or weekly-off calendar changed.
- Shift assigned/changed.
- Payroll draft processed/approved/finalized.
- Payslip released.

### CRM
- Lead created/updated/assigned.
- Opportunity stage changed.
- Follow-up created/updated/completed/overdue.
- Customer created/updated.
- Task assigned/completed.

### Billing
- Quotation created/sent/accepted/rejected.
- Invoice created/approved/issued/cancelled.
- Payment recorded/verified/refunded.
- Invoice becomes overdue.
- Customer outstanding balance changes.

### Admin
- User invited/activated/suspended.
- Role or permission changed.
- Security-sensitive setting changed.

## 9.3 Real-Time UI Behaviour
- Update authorized dashboards without requiring a manual page refresh.
- Update attendance tables when check-in/check-out occurs.
- Update manager/HR team counts when an employee's status changes.
- Update leave approval queues when requests are submitted or approved.
- Refresh payroll previews when source records change before payroll is finalized.
- Update CRM pipelines when an opportunity stage changes.
- Update invoice balances and customer outstanding totals after a verified payment is recorded.
- Show toast notifications for important events.
- Update notification count immediately.
- Use optimistic updates only when safe; reconcile with the server response.
- Show reconnecting/offline status if the WebSocket is disconnected.
- Use a reliable API refetch/polling fallback when WebSockets are unavailable.
- Avoid duplicate events and duplicate notifications.
- Ensure that an event is delivered only to users permitted to view the affected record.

## 9.4 Consistency and Reliability
- Every event must be based on a committed database transaction.
- Use transaction-safe event dispatch (for example, dispatch after commit).
- Include event type, record ID, timestamp, and minimal safe payload.
- The frontend should fetch the latest authorized record after receiving an event where needed.
- Do not send salary, bank details, identity documents, or other sensitive data over broad WebSocket groups.
- Add reconnection handling and event deduplication.

---

# 10. Unified Search and Global Navigation

Create a global search available from the top header. Search only records the user is allowed to view.

Searchable entities:
- Employees.
- Customers and contacts.
- Leads and opportunities.
- Quotations and invoices.
- Payments and receipts.
- Projects and tasks.
- Documents (metadata only unless the user has document access).

Features:
- Fast search suggestions.
- Group results by entity type.
- Keyboard navigation.
- Recent searches (optional).
- Permission-aware result counts.
- Clear empty and no-access states.

---

# 11. Reports and Analytics

Create a centralized Reports & Analytics area with role-aware report access.

Requirements:
- Date range filters.
- Department, branch, team, employee, salesperson, customer, and status filters where applicable.
- KPI cards and charts.
- Drill-down from chart to the underlying authorized records.
- Export to CSV/XLSX/PDF where permitted.
- Report scheduling as an optional feature using Celery.
- Report generation history.
- Prevent exports from bypassing data-scope and sensitive-field permissions.

Dashboards must use real API data. Do not hardcode chart values or display fake live counters.

---

# 12. Admin Panel and Organization Settings

The Admin Panel is part of the same ERP application and is available only to authorized users.

## 12.1 Organization Settings
- Organization/company name and logo.
- Registered and business addresses.
- Contact details.
- Tax and registration identifiers.
- Financial year.
- Time zone and date/time format.
- Currency and number format.
- Default language (English initially; keep internationalization possible).
- Branches and locations.
- Departments.
- Designations/job titles.
- Employment types.
- Working days and weekly offs.
- Holiday policies.
- Payroll settings.
- Invoice numbering and document templates.
- Tax settings.
- Email/SMS/payment/storage integration settings.

## 12.2 Branch and Department Management
- Add/edit/archive branches.
- Branch address and time zone.
- Add/edit/archive departments.
- Assign department heads.
- Configure branch-specific holidays and shifts.
- Define access scope by branch and department.

## 12.3 User, Role, and Permission Administration
- User management.
- Role management.
- Permission matrix.
- Role assignment.
- User access review.
- Session/device management.
- Login/security settings.

## 12.4 Customization and Module Controls
- Enable/disable optional modules.
- Configure custom fields where appropriate.
- Configure numbering sequences.
- Configure approval workflows.
- Configure notification rules.
- Configure data retention policies.
- Configure dashboard widgets by role, within permission limits.

---

# 13. Audit Logs and Security

Security and accountability are mandatory for an ERP handling payroll, employee, customer, and financial data.

## 13.1 Audit Log
Record important actions:
- Login/logout and failed login attempts.
- User creation, activation, suspension, and role changes.
- Permission changes.
- Employee record changes.
- Salary structure changes.
- Attendance manual edits and approvals.
- Leave decisions.
- Payroll processing, approval, finalization, reopening, and payslip release.
- Invoice issue/cancellation and payment changes.
- Customer and lead assignment changes.
- Document upload, view/download where appropriate, and deletion/archive.
- Organization and integration settings changes.

Audit record fields:
- Actor/user.
- Action.
- Module and entity type.
- Entity ID.
- Before/after values where safe and appropriate.
- Reason/comment where required.
- Timestamp.
- IP/device metadata where lawful and configured.

Audit logs must be tamper-resistant for normal application users. Do not allow ordinary admins to silently edit or erase audit history.

## 13.2 Security Controls
- Strong password hashing using Django's supported password hashers.
- Secure session/token management.
- CSRF protection where applicable.
- XSS, SQL injection, and IDOR protection.
- Rate limiting for login, OTP, password reset, and sensitive APIs.
- Server-side validation of all inputs.
- File type and size validation; malware scanning integration point for uploads.
- Private media storage for sensitive documents and attendance images.
- Permission checks on API, object, field, export, and WebSocket levels.
- HTTPS-only production deployment.
- Secure cookie configuration.
- Secrets in environment variables or a secrets manager.
- Database backups and restore procedure.
- Error messages must not expose stack traces or secrets to end users.
- Dependency and security update process.

## 13.3 Privacy and Data Protection
- Collect only data required for the ERP's stated functions.
- Explain camera and optional location use before requesting permission.
- Restrict salary, bank, identity, and personal document access.
- Provide configurable data retention and deletion/archival policies.
- Keep access history for sensitive records where appropriate.
- Support data export or correction requests through an authorized process.
- Ensure company policies and applicable local laws are reviewed before production use.

---

# 14. Database and Data Relationship Requirements

Design a normalized relational database. Use UUIDs or secure non-sequential identifiers for externally exposed record IDs where practical. Include created_at, updated_at, created_by, and updated_by fields on important business entities.

Suggested core entities (adjust naming to the final Django app structure):

### Organization and Access
- Organization
- Branch
- Department
- Designation
- User
- Employee
- Role
- Permission
- RolePermission
- UserRole
- UserDataScope
- UserSession / RefreshToken metadata
- AuditLog

### HRMS
- EmploymentRecord
- EmployeeDocument
- EmergencyContact
- SalaryStructure
- SalaryComponent
- EmployeeSalaryAssignment
- Shift
- ShiftAssignment
- WeeklyOffPolicy
- Holiday
- AttendanceEvent
- DailyAttendanceSummary
- AttendanceCorrectionRequest
- LeaveType
- LeavePolicy
- LeaveBalance
- LeaveApplication
- LeaveApproval
- PayrollPeriod
- PayrollRun
- PayrollLineItem
- Payslip
- PayrollApproval
- PayrollAdjustment

### CRM
- Lead
- Contact
- Customer / Account
- LeadSource
- Opportunity
- Pipeline
- PipelineStage
- CRMActivity
- FollowUp
- SalesTask
- Tag
- CustomFieldValue

### Billing and Finance
- ProductService
- TaxRate / TaxRule
- Quotation
- QuotationLineItem
- Invoice
- InvoiceLineItem
- CreditNote
- DebitNote
- Payment
- PaymentAllocation
- Receipt
- Expense
- ExpenseCategory
- FinancialAccount

### Supporting Modules
- Vendor
- Warehouse
- StockMovement
- PurchaseOrder
- PurchaseOrderLineItem
- GoodsReceipt
- Project
- ProjectTask
- Document
- Notification
- Announcement
- SupportTicket

Use foreign keys and indexes appropriately. Add unique constraints for invoice numbers within the configured numbering scope, employee IDs within the organization, and other business identifiers.

Maintain relationships across modules. Example:
- User ↔ Employee.
- Employee ↔ Department / Branch / Manager / Shift.
- Employee ↔ Attendance / Leave / Salary / Payroll / Payslip.
- Lead → Customer → Opportunity → Quotation → Invoice → Payment.
- Project → Employee / Customer / Task.
- Invoice line item → Product/Service and tax configuration.

Avoid storing calculated totals as independently editable values. Where totals are stored for performance, calculate them from validated line items and reconcile them in service logic.

---

# 15. Backend API Requirements

Organize Django code into clear domain apps, for example:

- `accounts` — authentication, users, sessions, password reset, 2FA.
- `organizations` — company, branch, department, designation, settings.
- `access_control` — roles, permissions, data scopes, policy checks.
- `hrms` — employees, attendance, shifts, leave, holidays.
- `payroll` — salary structures, payroll runs, payslips.
- `crm` — leads, customers, opportunities, activities, follow-ups.
- `billing` — products/services, quotations, invoices, payments, receipts.
- `finance` — expenses, financial accounts, summaries.
- `inventory` — stock, purchase, warehouses (if enabled).
- `projects` — projects and tasks.
- `documents` — secure file metadata and access.
- `notifications` — in-app and external notification delivery.
- `reports` — report services and exports.
- `audit` — audit log services.

API standards:
- Use versioned API routes such as `/api/v1/`.
- Use consistent response formats and status codes.
- Validate and serialize all inputs/outputs.
- Use pagination for list endpoints.
- Support filter/search/order parameters safely.
- Use service-layer functions for payroll, tax, attendance, and financial calculations.
- Use database transactions for multi-record business operations.
- Add idempotency protection for sensitive actions where appropriate (e.g. payment webhook processing and payroll finalization).
- Generate API documentation using OpenAPI/Swagger.
- Write tests for permission boundaries and business calculations.

Never place business-critical calculation logic only in React. The backend must be the authoritative source for attendance status, payroll, tax totals, invoice balances, and permissions.

---

# 16. Frontend Routes and Screen Structure

Use a shared route system with permission guards. Suggested route structure:

```text
/login
/forgot-password
/reset-password

/app/dashboard

/app/hrms/dashboard
/app/hrms/employees
/app/hrms/employees/:id
/app/hrms/attendance
/app/hrms/attendance/calendar
/app/hrms/attendance/corrections
/app/hrms/shifts
/app/hrms/leave
/app/hrms/leave/calendar
/app/hrms/holidays
/app/hrms/payroll
/app/hrms/payroll/salary-structures
/app/hrms/payroll/run
/app/hrms/payroll/approvals
/app/hrms/payroll/payslips
/app/hrms/my-profile
/app/hrms/my-attendance
/app/hrms/my-leave
/app/hrms/my-payslips

/app/crm/dashboard
/app/crm/leads
/app/crm/leads/:id
/app/crm/customers
/app/crm/customers/:id
/app/crm/opportunities
/app/crm/follow-ups
/app/crm/activities
/app/crm/tasks

/app/billing/dashboard
/app/billing/items
/app/billing/quotations
/app/billing/quotations/:id
/app/billing/invoices
/app/billing/invoices/:id
/app/billing/payments
/app/billing/receipts
/app/billing/expenses
/app/billing/reports

/app/projects
/app/tasks
/app/inventory
/app/purchase
/app/documents
/app/notifications
/app/reports

/app/admin/users
/app/admin/roles
/app/admin/permissions
/app/admin/organization
/app/admin/branches
/app/admin/departments
/app/admin/settings
/app/admin/audit-logs
```

This is a suggested route map. Actual route availability must depend on module activation and permission checks. Do not show inaccessible routes in navigation.

---

# 17. Required Workflow Demonstrations

Before declaring the ERP complete, demonstrate these end-to-end workflows with persisted database records.

## Workflow A — Login and Permissions
1. Create a Super Admin.
2. Super Admin creates HR, Manager, Employee, Sales, and Accounts users.
3. Super Admin creates or edits roles and assigns granular permissions.
4. Each user logs in through the same login page.
5. Verify each user sees the correct dashboard, sidebar, pages, buttons, and data scope.
6. Attempt unauthorized API and URL access and verify the backend denies it.

## Workflow B — Employee Onboarding
1. HR creates an employee.
2. HR assigns department, designation, branch, manager, shift, and employment date.
3. HR invites/activates the linked user account.
4. Employee logs in through the common login page.
5. Employee sees only their own permitted profile and self-service pages.

## Workflow C — Camera Attendance
1. Employee opens the attendance page.
2. Employee checks in with camera permission and captures a selfie.
3. Attendance is saved in the database with server timestamp.
4. HR and assigned Manager dashboards update in real time.
5. Employee checks out.
6. Total working time is calculated according to the assigned shift and break policy.
7. Employee requests a correction; manager/HR reviews and approves/rejects it.
8. The audit log records the entire correction history.

## Workflow D — Holiday and Weekly-Off Calendar
1. HR opens Holiday Management.
2. HR sees both calendar and table views.
3. HR clicks Add Holiday, enters details, and saves.
4. The holiday appears in the calendar and table without a manual page refresh.
5. HR edits the holiday and confirms the change.
6. HR archives/deletes a future holiday where allowed.
7. Employees and managers see only holidays applicable to their branch/group.

## Workflow E — Leave Approval
1. Employee applies for leave.
2. Manager receives a real-time notification.
3. Manager approves/rejects or requests changes.
4. HR sees the updated request if permitted.
5. Leave balance and attendance/payroll inputs update according to policy.

## Workflow F — Salary Setup and Payroll
1. HR creates a salary structure for an employee.
2. Salary change history records the effective date and editor.
3. HR configures a payroll period.
4. System imports approved attendance, leave, weekly offs, holidays, and eligible overtime.
5. System calculates payable days, earnings, deductions, and net pay.
6. HR reviews the employee-wise breakdown and exceptions.
7. A different authorized user approves the payroll.
8. Authorized payroll user finalizes it.
9. Employee sees only their own released payslip.
10. Payslip clearly explains gross salary, attendance, LOP/unpaid leave, each deduction, and net salary.
11. Confirm that paid holidays and weekly offs are not automatically deducted as unpaid absence.

## Workflow G — CRM to Invoice
1. Sales user creates a lead.
2. Sales user records follow-ups and activities.
3. Sales user converts the lead to a customer and opportunity.
4. Sales user creates and sends a quotation (using a configured email provider, or records it as drafted if not configured).
5. Authorized user marks the quotation accepted.
6. User converts the quotation to an invoice.
7. Accounts user records a partial payment.
8. Invoice balance and customer statement update in real time.

## Workflow H — Billing and Reports
1. Authorized user creates a product/service.
2. Authorized user creates an invoice with correct tax breakdown.
3. Invoice is approved and issued according to permissions.
4. Payment is recorded and allocated.
5. Receipt is generated.
6. Outstanding and tax reports reflect the transaction.
7. Unauthorized users cannot view financial details or export restricted data.

---

# 18. Testing and Quality Assurance

Create automated and manual test coverage for:

## Authentication and Permissions
- Valid/invalid login.
- Password reset.
- Session expiry and logout.
- Role assignment and permission changes.
- Object-level data scope.
- Field-level sensitive data access.
- Direct API access denial.
- WebSocket authorization.
- Export/download permission checks.

## HRMS
- Attendance check-in/check-out validation.
- Duplicate check-in prevention.
- Night shift and cross-midnight calculations.
- Grace period and late rules.
- Break calculation.
- Weekly-off and holiday handling.
- Leave balance and approval workflow.
- Attendance correction audit history.

## Payroll
- Salary component calculations.
- Effective-dated salary changes.
- Calendar-day and working-day divisor policies.
- Paid holiday and weekly-off treatment.
- Paid leave and unpaid leave/LOP handling.
- Half-day policy.
- Rounding rules.
- Deductions and recoveries.
- Duplicate payroll prevention.
- Maker-checker approval.
- Finalized payroll lock.
- Employee-only payslip visibility.

## CRM and Billing
- Lead conversion.
- Opportunity stage history.
- Quotation calculations.
- Tax calculations for configured rules.
- Invoice numbering uniqueness.
- Partial payment allocation.
- Refund and cancellation controls.
- Outstanding balance calculation.
- CRM-to-invoice relationship preservation.

## Realtime
- WebSocket authentication.
- Event delivery to authorized users only.
- Dashboard and table updates.
- Reconnection and polling fallback.
- Duplicate event handling.
- Event delivery after committed transactions only.

## UI and Responsiveness
- Desktop, tablet, and mobile screen checks.
- Keyboard navigation.
- Loading, empty, and error states.
- Form validation.
- Confirmation dialogs.
- No broken links or non-functional buttons.

---

# 19. Development Phases and Deliverables

Build in phases, but keep all modules within one coherent codebase and shared authorization model.

## Phase 1 — Foundation and Unified Access
- React app shell and responsive design system.
- Django project and PostgreSQL configuration.
- Common login, password reset, session handling.
- Organization, branch, department, and employee base models.
- Dynamic RBAC with roles, permissions, data scope, and secure API enforcement.
- Admin user/role/permission screens.
- Audit logging foundation.

**Acceptance:** Different roles log in through one page and see only authorized menus, screens, actions, and data. Backend blocks unauthorized requests.

## Phase 2 — HRMS Core
- Employee directory and profiles.
- Employee self-service.
- Camera-based check-in/check-out.
- Attendance tables, corrections, and approvals.
- Shift, weekly-off, and holiday management.
- Holiday calendar with Add/Edit/Delete/Archive actions.
- Leave management and approvals.
- Real-time HR and Manager dashboards.

**Acceptance:** Attendance, leave, holiday, and employee changes are saved in the database and update authorized dashboards in real time.

## Phase 3 — Payroll
- Salary structure and effective-dated salary assignments.
- Attendance-linked payroll calculation.
- Payroll exception handling.
- Maker-checker approval.
- Payroll finalization and lock.
- PDF payslips and employee self-service visibility.
- Payroll reports and audit history.

**Acceptance:** Payroll calculations are reproducible, explainable, tested, policy-driven, and secure. Employee sees their own payslip only.

## Phase 4 — CRM and Sales
- Leads, customers, contacts, opportunities, and pipeline.
- Follow-ups, activities, tasks, and reminders.
- Assignment rules and manager dashboards.
- CRM real-time updates.

**Acceptance:** Sales users can manage their authorized records and managers can monitor their permitted teams.

## Phase 5 — Billing and Finance
- Products/services.
- Quotations and estimates.
- Invoices and tax configuration.
- Payments, allocations, receipts, and outstanding balances.
- Expenses and financial summaries.
- PDF templates and reports.
- CRM-to-billing conversion.

**Acceptance:** A lead can become a customer, quotation, invoice, and payment record without breaking links or duplicating records.

## Phase 6 — Supporting ERP Modules
- Inventory and purchase.
- Projects and tasks.
- Document management.
- Helpdesk.
- Announcements and notification preferences.
- Advanced reports and scheduled reports.

**Acceptance:** Optional modules reuse the same organization, authentication, RBAC, audit, notification, and real-time architecture.

## Phase 7 — Production Readiness
- Performance testing.
- Security review.
- Backup and restore tests.
- Logging and monitoring.
- Production environment configuration.
- Deployment documentation.
- User acceptance testing.
- Admin and user guides.

**Acceptance:** The platform can be deployed securely and operated without relying on mock data or development-only settings.

---

# 20. Required Final Handover

Provide the following deliverables:

1. Complete React + TypeScript frontend source code.
2. Complete Python Django + Django REST Framework backend source code.
3. PostgreSQL database models and migrations.
4. API documentation (OpenAPI/Swagger).
5. WebSocket event documentation.
6. Role and permission matrix with default role examples.
7. `.env.example` containing placeholders only.
8. Development setup instructions.
9. Production deployment instructions.
10. Database backup and restore instructions.
11. Seed command for development/demo data.
12. Automated tests and instructions to run them.
13. Admin guide for users, roles, permissions, branches, departments, holidays, shifts, and payroll settings.
14. Employee guide for login, attendance, leave, and payslips.
15. Known limitations and integrations that still require credentials or external approval.

Do not mark a feature complete merely because its screen exists. A feature is complete only when its UI, backend API, database persistence, permissions, validations, business workflow, audit history, and tests are implemented.

---

# 21. Non-Negotiable Acceptance Criteria

The ERP will be accepted only when all of the following are true:

- [ ] HRMS, CRM, and Billing are modules of one ERP application.
- [ ] React is used for the frontend and Python Django for the backend.
- [ ] All user roles use one common login page.
- [ ] Super Admin, Sub-Admin, HR, Manager, Employee, Accounts, and Sales roles can be configured.
- [ ] Custom roles and granular permissions can be created from the Admin Panel.
- [ ] Permissions control menus, pages, fields, actions, APIs, exports, downloads, and real-time subscriptions.
- [ ] Data scope supports own, assigned, team, department, branch, and organization-wide access.
- [ ] HRMS includes employee management, attendance, camera check-in/check-out, shifts, leave, holidays, weekly offs, payroll, and payslips.
- [ ] Holiday Management has a calendar, table, Add Holiday, Edit, Delete/Archive, and filters.
- [ ] Employees can view their own attendance, leave, holiday calendar, and released payslips according to permissions.
- [ ] HR can manage employee salary structures only with explicit salary permissions.
- [ ] Employees cannot edit or approve their own salary or payroll.
- [ ] Payroll clearly explains payable days, holidays, weekly offs, paid leave, unpaid leave/LOP, earnings, deductions, and net salary.
- [ ] Paid public holidays and scheduled weekly offs are not automatically deducted as unpaid absence.
- [ ] Payroll uses configurable, effective-dated policies and has a review/approval/finalization workflow.
- [ ] CRM includes leads, customers, opportunities, follow-ups, activities, and sales tasks.
- [ ] Billing includes products/services, quotations, invoices, taxes, payments, receipts, outstanding balances, and reports.
- [ ] CRM records can flow into quotations and invoices while preserving relationships.
- [ ] Real-time events update all authorized dashboards and tables without manual refresh.
- [ ] WebSocket events never expose records or sensitive fields to unauthorized users.
- [ ] Important changes are recorded in audit logs.
- [ ] The platform is responsive on desktop, tablet, and mobile.
- [ ] All buttons and workflows work with real backend data; there are no fake success messages or placeholder actions.
- [ ] Automated tests cover permissions, payroll calculations, attendance, billing, and real-time authorization.
- [ ] Setup, deployment, backup, and user documentation are included.

---

# Final Build Direction

Build this as a secure, scalable, modular business ERP with a premium and easy-to-use interface. The most important principle is **one login, one application, one database architecture, one permission system, and connected modules**.

Every user should see a dashboard and workspace appropriate to their role, but all users must work inside the same ERP. Super Admin controls access. Sub-Admins receive limited assigned access. HR manages HR operations. Managers manage their authorized teams. Employees use self-service. Sales manages CRM. Accounts manages billing and finance.

Prioritize correctness, data security, clear payroll calculations, reliable real-time synchronization, and complete end-to-end workflows over decorative UI. Build the foundation properly so additional ERP modules can be added later without creating separate systems.
