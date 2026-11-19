# Greenbacks ERP — Complete Sidebar, Screen & Workflow Guide

**Companion document to:** `Greenbacks_ERP_Full_Build_Prompt.md`  
**Frontend:** React + TypeScript  
**Backend:** Python + Django + Django REST Framework  
**Real-time layer:** Django Channels + WebSockets + Redis  
**Database:** PostgreSQL  
**Purpose:** Explain exactly what users see in the ERP, what belongs in every sidebar, how each screen works, which buttons and actions are required, and how HRMS, CRM, Billing, Finance, and supporting modules remain connected.

---

# 1. Instructions for the Development Agent

Use this document together with the main ERP build prompt. The main prompt defines the platform, architecture, security, and broad module requirements. This companion document defines the practical application navigation and screen-by-screen user experience.

Build a working application, not a collection of static designs. Every visible menu item, button, form, table action, filter, approval, calendar event, dashboard card, notification, and report must be connected to a real frontend route and backend API. Persist all business records in the database.

## 1.1 Non-negotiable navigation rules

1. There is **one login page, one ERP application, one shared application shell, and one shared sidebar system**.
2. Super Admin, Sub-Admin, HR, Manager, Employee, Accounts, Sales, and custom-role users do not receive separate applications. They receive different menu items, dashboard widgets, data, fields, and actions inside the same application according to their effective permissions.
3. The sidebar is generated dynamically from the user's active roles, granted permissions, assigned data scope, and enabled modules.
4. Do not display a menu item merely because a user has a role name such as HR or Manager. Check the user's actual permissions.
5. Hiding a menu item is not security. Backend APIs, object access, downloads, exports, and WebSocket subscriptions must independently enforce the same permissions and data scope.
6. Use one consistent page pattern, design system, table system, modal system, and form system throughout the ERP.
7. Do not create duplicate copies of the same employee, customer, supplier, product, quotation, invoice, or payment when moving between modules. Link related records using database relationships.
8. Every change that affects another user's permitted view must update the correct dashboard, table, notification, and activity feed in real time.
9. A user must never receive confidential information simply because they can see a related record. For example, a Manager may see a team member's leave status but not their salary or bank details unless those separate permissions are granted.
10. Show clear access-denied, loading, empty, offline, and error states. Never leave a blank page or a button that does nothing.

## 1.2 Required delivery approach

Before coding, prepare:
- The complete navigation tree.
- The page-to-permission matrix.
- The route map.
- The entity relationship diagram.
- The approval flow map.
- The event map for real-time updates.

Then implement the shared shell and access control first, followed by the modules in the phases in Section 23. Keep the system modular so later modules can be activated without redesigning the navigation.

---

# 2. Overall Application Layout

## 2.1 Desktop layout

The desktop ERP must use this common structure:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Company Logo | Page / Breadcrumb | Global Search | Quick Add | 🔔 | User │
├───────────────────┬──────────────────────────────────────────────────────┤
│                   │                                                      │
│  SIDEBAR          │  PAGE HEADER                                         │
│                   │  Page title + description + primary action          │
│  Overview         │                                                      │
│  My Workspace     │  KPI cards / filters / tabs                          │
│  HRMS             │                                                      │
│  CRM & Sales      │  Table / calendar / Kanban / forms / charts           │
│  Billing & Finance│                                                      │
│  Inventory        │  Details drawer / activity timeline when applicable  │
│  Projects         │                                                      │
│  Documents        │                                                      │
│  Reports          │                                                      │
│  Helpdesk         │                                                      │
│  Administration   │                                                      │
│                   │                                                      │
│  Help / Collapse  │                                                      │
└───────────────────┴──────────────────────────────────────────────────────┘
```

### Sidebar behaviour
- Expanded width should be comfortable for icon plus readable menu labels.
- Collapsed mode should show icons with accessible tooltips.
- A group with children expands and collapses on click.
- Highlight the active menu and active submenu.
- Keep the active submenu expanded after page refresh.
- Store only harmless UI preferences, such as collapsed/expanded state, in local storage. Permissions must always come from the backend.
- If a group has no visible child items, hide the entire group.
- Do not show disabled links for inaccessible modules unless the product owner explicitly requests an upgrade/feature notice. Default behaviour is to hide unauthorized entries.
- Show a small badge only for meaningful counts such as pending approvals, overdue tasks, or unread notifications.
- Sidebar counts must be permission-filtered. An Employee must not see the count of all company leave requests or all payroll exceptions.

## 2.2 Mobile and tablet layout

- On mobile, convert the left sidebar into a slide-out navigation drawer opened by a hamburger button.
- Keep the top header compact: menu, page title, notifications, profile.
- Put the most important actions within thumb reach, without covering forms or table content.
- On small screens, convert wide tables to responsive cards or allow controlled horizontal scrolling with the first identifier column visible when practical.
- Calendars must offer Month, Week, and Agenda/List modes. On mobile, open Agenda/List by default where the month grid is too cramped.
- Forms should become single-column on mobile. Use clear section headings and sticky Save/Submit actions only when they do not cover content.
- Camera attendance must use the device's available front camera when the browser allows it and show clear camera-permission instructions.
- Do not make any critical workflow desktop-only.

## 2.3 Global top header

The header is common to every role. Each element is independently permission-aware.

| Header item | What it does | Visibility / rules |
|---|---|---|
| Company logo/name | Shows active organization or company identity | Organization branding setting |
| Breadcrumbs | Shows the user's position, e.g. HRMS > Attendance > Corrections | Based on current route |
| Global search | Searches permitted records across modules | Search only records and fields the user may view |
| Quick Add | Opens a menu to create permitted records | Each option checks Create permission |
| Notifications bell | Opens recent notifications and unread count | User-specific notification feed |
| Help / Support | Opens help guides or creates a ticket | Depends on Helpdesk access |
| Role/workspace switcher | Switches only between roles already assigned to the user | Hide if user has one active role; switching cannot add permission |
| User profile menu | Profile, preferences, security, active sessions, logout | Self-service plus permitted administration |

### Global Search behaviour
Search by employee ID/name, customer, lead, opportunity, quotation, invoice, payment reference, task, project, document metadata, and other enabled entities. Group results by type. Show a short safe summary and status. Selecting a result opens its detail page only after the backend confirms access. Do not reveal the existence or number of inaccessible records.

### Quick Add behaviour
Show only actions the current user may create, such as Add Employee, Add Lead, Add Customer, Create Quotation, Create Invoice, Add Expense, Create Task, or Raise Ticket. Opening a quick-add form must apply the same validations and server-side checks as the full module page.

---

# 3. Complete Sidebar Navigation Tree

This is the master navigation tree. It is not a promise that every user sees all items. The ERP must calculate each menu item from permissions and module activation.

```text
OVERVIEW
  └── My Dashboard

MY WORKSPACE
  ├── My Profile
  ├── My Attendance
  ├── Check In / Check Out
  ├── My Leave
  ├── My Holiday Calendar
  ├── My Shifts & Schedule
  ├── My Payslips
  ├── My Salary Summary
  ├── My Tasks
  ├── My Documents
  ├── My Requests / Helpdesk
  └── Company Announcements

HRMS
  ├── HR Dashboard
  ├── Employee Management
  │   ├── Employee Directory
  │   ├── Add Employee
  │   ├── Departments
  │   ├── Designations
  │   ├── Reporting Structure
  │   ├── Onboarding
  │   ├── Probation & Confirmation
  │   └── Resignation & Exit
  ├── Attendance Management
  │   ├── Live Attendance
  │   ├── Attendance Register
  │   ├── Attendance Calendar
  │   ├── Attendance Corrections
  │   ├── Late & Early Checkout
  │   ├── Overtime / On-Duty
  │   └── Attendance Rules
  ├── Shifts & Rosters
  │   ├── Shift Master
  │   ├── Shift Assignments
  │   ├── Weekly-Off Rules
  │   └── Work Schedules
  ├── Leave Management
  │   ├── Leave Dashboard
  │   ├── Leave Applications
  │   ├── Approval Queue
  │   ├── Leave Calendar
  │   ├── Leave Balances
  │   ├── Leave Types
  │   └── Leave Policies
  ├── Holiday Management
  │   ├── Holiday Calendar
  │   ├── Holiday List / Table
  │   ├── Add Holiday
  │   └── Holiday Rules
  ├── Payroll & Salary
  │   ├── Payroll Dashboard
  │   ├── Salary Components
  │   ├── Salary Templates
  │   ├── Employee Salary Assignments
  │   ├── Salary Revision Requests
  │   ├── Payroll Periods
  │   ├── Run Payroll
  │   ├── Payroll Preview & Exceptions
  │   ├── Payroll Approval Queue
  │   ├── Finalized Payroll
  │   ├── Payslip Management
  │   ├── Payroll Payments
  │   └── Payroll Reports
  ├── Recruitment (optional)
  │   ├── Job Requisitions
  │   ├── Candidates
  │   ├── Interviews
  │   └── Offers
  ├── Performance (optional)
  │   ├── Goals / KPIs
  │   ├── Reviews
  │   └── Appraisals
  └── HR Reports

CRM & SALES
  ├── CRM Dashboard
  ├── Leads
  │   ├── All Leads
  │   ├── My Leads
  │   ├── Unassigned Leads
  │   ├── Import Leads
  │   └── Lead Sources
  ├── Customers & Contacts
  │   ├── Customer Directory
  │   ├── Contacts
  │   └── Customer Groups / Tags
  ├── Opportunities
  │   ├── Pipeline Board
  │   ├── Opportunity List
  │   └── Sales Forecast
  ├── Follow-Ups & Activities
  │   ├── Today's Follow-Ups
  │   ├── Overdue Follow-Ups
  │   ├── Calendar
  │   └── Activity History
  ├── Sales Tasks
  ├── Quotations
  ├── Sales Targets
  ├── Campaigns (optional)
  └── CRM Reports

BILLING & FINANCE
  ├── Finance Dashboard
  ├── Products & Services
  │   ├── Item / Service List
  │   ├── Categories
  │   └── Tax Rates
  ├── Quotations & Estimates
  ├── Sales Orders (optional)
  ├── Invoices
  │   ├── All Invoices
  │   ├── Draft Invoices
  │   ├── Pending Approval
  │   ├── Issued Invoices
  │   ├── Partially Paid
  │   ├── Paid
  │   └── Overdue
  ├── Credit Notes / Debit Notes
  ├── Payments
  ├── Receipts
  ├── Customer Ledger / Statements
  ├── Expenses
  │   ├── All Expenses
  │   ├── My Expenses
  │   ├── Expense Categories
  │   └── Expense Approvals
  ├── Vendors & Payables (if Purchase is enabled)
  ├── Cash / Bank Accounts
  ├── Tax Centre
  └── Finance Reports

INVENTORY & PURCHASE
  ├── Inventory Dashboard
  ├── Product / SKU Master
  ├── Stock Overview
  ├── Warehouses
  ├── Stock In / Stock Out
  ├── Stock Transfers
  ├── Stock Adjustments
  ├── Low Stock Alerts
  ├── Suppliers / Vendors
  ├── Purchase Requests
  ├── Purchase Orders
  ├── Goods Received Notes
  ├── Purchase Bills
  ├── Supplier Payments
  └── Inventory & Purchase Reports

PROJECTS & OPERATIONS
  ├── Projects Dashboard
  ├── All Projects
  ├── My Projects
  ├── Project Calendar
  ├── Tasks & Subtasks
  ├── Team Workload
  ├── Time Logs (optional)
  └── Project Reports

DOCUMENTS
  ├── Document Centre
  ├── My Documents
  ├── Shared With Me
  ├── Templates
  └── Expiring Documents

COMMUNICATION
  ├── Notification Centre
  ├── Announcements
  ├── Internal Messages (optional)
  └── Helpdesk / Support Tickets

REPORTS & ANALYTICS
  ├── Executive Overview
  ├── HRMS Reports
  ├── CRM & Sales Reports
  ├── Billing & Finance Reports
  ├── Inventory Reports
  ├── Projects & Task Reports
  ├── Custom Report Builder (permission-controlled)
  └── Scheduled Reports

ADMINISTRATION
  ├── Admin Dashboard
  ├── User Management
  ├── Roles & Permissions
  ├── Permission Matrix
  ├── Access Review
  ├── Organization Profile
  ├── Branches / Locations
  ├── Departments
  ├── Designations
  ├── Teams & Reporting Lines
  ├── Approval Workflows
  ├── Module Management
  ├── Custom Fields
  ├── Numbering & Document Settings
  ├── Attendance & Leave Settings
  ├── Payroll Settings
  ├── Tax & Billing Settings
  ├── Notification Settings
  ├── Integrations
  ├── Security & Login Settings
  ├── Audit Logs
  ├── Data Import / Export
  ├── Backup & Data Retention
  └── System Health
```

**Important implementation note:** “Add Employee”, “Add Holiday”, “Create Invoice”, and similar entries may be either a submenu route or a page-level button. Do not show duplicate navigation entries if the same action is already clearly available from the corresponding module page. Prefer a compact sidebar and place create actions on their relevant list pages and in Quick Add.

---

# 4. Role-Based Sidebar Examples

These examples explain the intended result after permissions are assigned. The actual menu must always be computed from permissions, not hard-coded by role name.

## 4.1 Super Admin sidebar

A Super Admin with all system permissions may see:
- Overview: My Dashboard, Executive Overview.
- My Workspace: personal profile and self-service features.
- HRMS: all enabled HRMS sections, including sensitive payroll setup and approvals.
- CRM & Sales: all enabled CRM and sales sections.
- Billing & Finance: all enabled financial sections.
- Inventory & Purchase: all enabled sections.
- Projects & Operations: all enabled sections.
- Documents and Communication.
- Reports & Analytics: organization-wide reports.
- Administration: users, roles, permission matrix, organization, branches, settings, workflows, integrations, security, audit logs, backups, and system health.

Even Super Admin actions must be audited. High-risk payroll and payment actions should retain maker-checker safeguards unless the organization explicitly configures an emergency override with a reason and audit trail.

## 4.2 Sub-Admin sidebar

A Sub-Admin sees only the modules, branches, departments, records, and actions assigned by Super Admin. Example:
- Overview.
- HRMS Employee Directory and Attendance Register, but no payroll salary access.
- CRM Leads and Customers for one branch.
- Billing Invoices with View and Export but no Issue/Cancel permission.
- Reports for assigned branch only.
- No Roles & Permissions unless that separate administration permission is granted.

The Sub-Admin must not be able to create another admin or grant permissions beyond the maximum authority delegated by Super Admin.

## 4.3 HR sidebar

Typical HR access may include:
- Overview / HR Dashboard.
- My Workspace.
- HRMS: Employee Management, Attendance, Attendance Corrections, Shifts & Rosters, Leave Management, Holiday Management, Payroll & Salary, HR Reports.
- Documents: employee documents permitted to HR.
- Communication: announcements and HR helpdesk tickets.
- Reports: HR reports.

Salary screens and salary fields must appear only if the HR user has explicit salary permissions. HR may prepare a payroll run without having final approval or release permission. HR should not approve their own salary changes or payroll entries.

## 4.4 Manager sidebar

Typical Manager access may include:
- Overview / My Dashboard.
- My Workspace.
- Team Workspace: team attendance, team leave requests, team tasks, team schedule (show only if configured and permissioned).
- HRMS: My Team, Attendance View Team, Leave Approval Queue, Team Calendar. No employee bank data or payroll by default.
- CRM & Sales: assigned/team leads, customers, opportunities, follow-ups, tasks, quotations if assigned.
- Projects & Operations: assigned team projects and tasks.
- Reports: team-level reports only.

A Manager must not see other departments or teams unless their data scope includes them. A Manager's access to an employee record does not automatically grant salary access.

## 4.5 Employee sidebar

Typical Employee access may include:
- Overview / My Dashboard.
- My Workspace: My Profile, My Attendance, Check In / Check Out, My Leave, My Holiday Calendar, My Shifts & Schedule, My Payslips, My Salary Summary, My Tasks, My Documents, My Requests, Company Announcements.
- Helpdesk / Support Tickets.

The Employee must see only their own personal records. They may view and download their own released payslips if permitted, but they cannot edit salary, attendance, approved leave, payroll, or bank details directly. Provide secure request workflows for changes.

## 4.6 Accounts / Finance sidebar

Typical Accounts access may include:
- Overview / Finance Dashboard.
- Billing & Finance: Products & Services, Quotations, Invoices, Payments, Receipts, Expenses, Customer Ledger, Tax Centre, Finance Reports.
- Vendors & Payables if authorized.
- Payroll payment totals or payment export only if explicitly granted; do not expose detailed employee HR records automatically.

## 4.7 Sales / CRM Executive sidebar

Typical Sales access may include:
- Overview / CRM Dashboard.
- CRM & Sales: My Leads, Leads, Customers, Contacts, Opportunities, Follow-Ups, Activities, Sales Tasks, Quotations, Sales Targets.
- Billing: limited view of invoices and payment status for assigned customers if granted.
- Reports: own sales activity and performance.

Sales users must not see cost price, margin, payment account details, or other sensitive finance fields unless separately permitted.

---

# 5. Dashboard Behaviour and Layout

## 5.1 Shared dashboard principles

The dashboard is the user's landing page after login. It must be role-aware and permission-aware. It is not a fixed page with all company KPIs visible to everyone.

Dashboard layout:
1. Welcome message with user name and current date/time according to organization time zone.
2. KPI cards for the user's allowed scope.
3. Main charts or operational summaries.
4. Pending actions and approval queue.
5. Calendar or today's schedule.
6. Recent activity and notifications.
7. Quick actions.

Each widget should be independently configurable by permission and user preference. A user can rearrange permitted widgets if dashboard personalization is enabled, but personalization must never bypass access control.

## 5.2 Super Admin dashboard

Suggested widgets:
- Active employees.
- Employees present today.
- Employees on leave today.
- New leads this month.
- Open opportunities and pipeline value.
- Sales this month.
- Invoice outstanding amount.
- Payments received this month.
- Pending invoice approvals.
- Pending payroll approval.
- Pending leave approvals.
- Branch-wise performance.
- Revenue and expense trend.
- System health and integration alerts.
- Recent audit-sensitive actions.

Each KPI opens a filtered report or list. All values must come from backend aggregation APIs and be permission-checked.

## 5.3 HR dashboard

Suggested widgets:
- Total active employees.
- Present, absent, late, on leave, WFH, and on-duty today.
- Pending attendance corrections.
- Pending leave requests.
- Upcoming holidays.
- Upcoming employee birthdays/anniversaries, if enabled by policy.
- New joiners and employees in probation.
- Payroll period status.
- Payroll exceptions and approval status, if permitted.
- Department-wise headcount and attendance trend.

## 5.4 Manager dashboard

Suggested widgets:
- Team present/absent/late/on leave today.
- Team attendance trend.
- Pending team leave approvals.
- Team attendance correction requests.
- Team tasks due today and overdue.
- Team opportunities and follow-ups, if CRM access exists.
- Upcoming team schedule and holidays.

## 5.5 Employee dashboard

Suggested widgets:
- Current attendance state with Check In / Check Out action.
- Check-in time, check-out time, hours worked, and break duration.
- Monthly attendance count and status summary.
- Leave balance and recent leave requests.
- Upcoming holidays and weekly offs.
- Assigned shift and weekly schedule.
- Latest released payslip and salary summary, if enabled.
- Tasks due today.
- Announcements and notifications.
- Shortcuts to submit leave, correction, expense, or helpdesk request where allowed.

## 5.6 CRM dashboard

Suggested widgets:
- Total leads and newly created leads.
- Leads by source and stage.
- Leads awaiting assignment.
- Open opportunities and pipeline value.
- Won/lost deals.
- Conversion rate.
- Follow-ups due today and overdue.
- Sales tasks and team performance.

## 5.7 Finance dashboard

Suggested widgets:
- Invoice value this month.
- Amount received.
- Outstanding receivables.
- Overdue invoices.
- Draft and pending approval invoices.
- Recent payments.
- Expense summary.
- Revenue and expense trends.
- Customer-wise outstanding balance.

---

# 6. Standard Page Design, Tables, Forms, and Buttons

## 6.1 Standard list page layout

Every list page should use a common pattern:

```text
Page title                         [Primary action: + Add New]
Short description / help text

[KPI card] [KPI card] [KPI card] [KPI card]

[Search] [Date filter] [Status] [Department] [More filters] [Reset]

[Tabs: All | Draft | Pending | Approved | Archived]

┌──────────────────────────────────────────────────────────────────────┐
│ Select | Record ID | Main details | Status | Updated | Actions       │
├──────────────────────────────────────────────────────────────────────┤
│ ...                                                                  │
└──────────────────────────────────────────────────────────────────────┘

[Selected rows actions]                 [Pagination / rows per page]
```

Use the relevant elements only; do not add irrelevant KPIs or filters to every page.

## 6.2 Standard table features

- Search by meaningful fields.
- Pagination with configurable page size.
- Server-side sorting and filtering for large data.
- Column visibility controls.
- Row selection for permitted bulk actions.
- Export only records and fields permitted to the user.
- Saved filters/views where useful.
- Clear empty state with a relevant Add button if the user has Create permission.
- Row click opens detail view; action menu provides row-specific actions.
- Show created/updated time in a consistent format and organization time zone.
- On mobile, use cards or responsive table mode.

## 6.3 Standard row action menu

Show only allowed actions:
- View Details.
- Edit.
- Assign / Reassign.
- Approve / Reject.
- Download / Print.
- Change Status.
- Archive.
- Delete, only when hard deletion is safe and explicitly permitted.
- View Activity / Audit History.

Use archive/soft-delete for important business records. Never silently delete payroll, issued invoices, payment records, or attendance history.

## 6.4 Standard form behaviour

Every Add/Edit form must have:
- Clear title and purpose.
- Required and optional fields marked.
- Input validation with understandable messages.
- Grouped sections and conditional fields.
- Searchable dropdowns for large lists.
- Date and time controls using organization settings.
- File upload restrictions, preview, and upload progress.
- Save Draft where appropriate.
- Submit / Save button.
- Cancel button with unsaved-changes warning.
- Confirmation for sensitive or irreversible actions.
- Server-side validation and clear error response handling.

After save, update the detail page, list page, relevant dashboard widgets, related records, and notifications in real time where appropriate.

## 6.5 Standard detail page

Use tabs or sections where the record is complex:
- Overview.
- Details.
- Related records.
- Documents.
- Notes / Comments.
- Activity Timeline.
- Approvals / History.

The user may see a tab only when they have permission to view its information. Never load confidential tab data in the background for a user who cannot access it.

---

# 7. HRMS — Detailed Sidebar Screens and Workflows

# 7.1 HRMS > HR Dashboard

**Purpose:** Give HR a live operational view of employee strength, attendance, leave, and payroll progress.

Top cards:
- Total Employees.
- Present Today.
- Absent Today.
- On Leave Today.
- Late Today.
- Pending Leave.
- Pending Attendance Corrections.
- Payroll Status.

Main content:
- Attendance trend chart.
- Department/branch headcount chart.
- Leave calendar preview.
- Recent joining and exit activity.
- Payroll processing status.
- Pending HR actions.

Actions:
- View Attendance.
- Add Employee.
- Add Holiday.
- Review Leave.
- Run Payroll (only if permission exists).

All counts must use active employee status, assigned branches, department access, and the user's data scope.

# 7.2 HRMS > Employee Management

## Employee Directory

Table columns:
- Employee ID.
- Profile photo/avatar.
- Employee name.
- Department.
- Designation.
- Branch.
- Reporting Manager.
- Employment Type.
- Date of Joining.
- Status.
- Actions.

Filters:
- Search name, ID, email, and phone where permitted.
- Department.
- Designation.
- Branch.
- Manager.
- Employment status.
- Joining date range.
- Employment type.

Top actions:
- Add Employee.
- Import Employees.
- Export Employees.
- Bulk Assign Manager / Department / Branch / Shift (permission-controlled).

### Add Employee form

Use grouped sections:

**A. Basic Details**
- First name, middle name (optional), last name.
- Profile photo.
- Gender or other organization-required field only where lawful and necessary.
- Date of birth (restricted access).
- Personal mobile and email.

**B. Employment Details**
- Employee ID (auto-generated or controlled manual entry).
- Date of joining.
- Department.
- Designation.
- Branch / work location.
- Reporting manager.
- Employment type.
- Probation period and confirmation date.
- Work status.

**C. Work Schedule**
- Shift.
- Weekly-off policy.
- Work mode (office, remote, hybrid, field).
- Attendance policy.

**D. Contact and Emergency Contact**
- Address.
- Emergency contact name, relationship, phone.

**E. Documents**
- Offer/appointment letter.
- Identity documents where required.
- Education/experience certificates.
- Other permitted documents.

**F. Login Access**
- Create login now / later.
- Work email or username.
- Role assignment.
- Require password setup at first login.
- Send invitation only if email integration is configured.

**G. Salary and Bank Details**
- Show only to users with separate sensitive permissions.
- Do not expose these details to ordinary HR or Manager by default.

Buttons: Save as Draft, Save & Activate, Save & Create Login, Cancel.

### Employee profile page

Header:
- Photo, name, Employee ID, department, designation, status.
- Quick actions: Edit, Assign Shift, Change Manager, Request Document, Deactivate/Exit (permission-based).

Tabs:
1. Overview.
2. Personal Details.
3. Employment Details.
4. Attendance.
5. Leave.
6. Shift & Schedule.
7. Salary (sensitive).
8. Payslips (sensitive).
9. Documents.
10. Tasks / Projects.
11. Performance (if enabled).
12. Assets (if enabled).
13. Activity / Audit History.

Every tab must be protected by its own permission. The employee's own profile should be rendered with self-service field restrictions.

### Employee lifecycle workflow

`Draft → Pre-Joining → Active / Probation → Confirmed → Notice Period → Exit Completed → Archived`

- HR starts an employee record.
- HR completes mandatory fields and documents.
- Authorized user activates employment.
- If login is requested, the system creates/invites a linked user account.
- The employee is assigned department, manager, branch, shift, weekly off, leave policy, and permissions.
- Confirmation and probation reminders are sent according to configured rules.
- On exit, authorized HR completes notice, assets, documents, final settlement inputs, and account deactivation.
- Account deactivation should revoke sessions and block future access, while retaining legally/business-required employment history.

# 7.3 HRMS > Attendance Management

## Live Attendance

Purpose: Show today's current attendance as it changes.

Top summary:
- Present.
- Not Checked In / Absent (according to current rules).
- Late.
- On Leave.
- Weekly Off / Holiday.
- Work From Home / On Duty.

Table columns:
- Employee ID and Name.
- Department / Branch.
- Shift.
- Check-in time.
- Check-in image indicator.
- Check-out time.
- Check-out image indicator.
- Hours worked.
- Late / early duration.
- Status.
- Last updated.
- Actions.

Actions: View, View permitted attendance image, Correct, Approve correction, Add manual record, Export, View audit trail.

Use server timestamps as the source of truth. A newly checked-in employee should appear in this view and permitted HR/Manager dashboards without page refresh.

## Employee Check In / Check Out screen

The Employee sees a large attendance panel:
- Current date and shift.
- Attendance status.
- Check In button if no valid check-in exists.
- Check Out button after check-in and before checkout.
- Live camera preview after camera permission is requested.
- Capture / Retake / Confirm controls.
- Timestamp shown after the server accepts the event.
- Today's hours and break summary.

Flow:
1. User opens Check In / Check Out.
2. Frontend obtains camera permission only after user action and shows a privacy explanation.
3. The user captures a selfie if company policy requires it.
4. Frontend sends the image securely to a protected endpoint.
5. Backend validates user, shift, current attendance state, request idempotency, time rules, and allowed location policy if enabled.
6. Backend saves the attendance event and returns confirmed server timestamp and status.
7. Frontend displays success based on the server response; do not show success before the server accepts the record.
8. Backend publishes a safe attendance event after database commit.
9. HR and authorized Manager Live Attendance views update.

If camera is unavailable, show a clear fallback according to policy: retry, use an allowed alternate device, or submit an attendance correction request. Do not silently create an attendance record.

## Attendance Register

A historical daily/monthly attendance table with date range, department, branch, employee, manager, shift, and status filters. Include a summary row and an employee-wise drill-down.

## Attendance Calendar

- Month, week, and agenda views.
- Colour/status labels for Present, Absent, Late, Leave, Holiday, Weekly Off, WFH, and On Duty.
- Filter by employee, team, department, branch, and status, based on scope.
- Clicking a date opens the day's attendance detail.

## Attendance Corrections

Table columns: Request ID, Employee, Date, Original Entry, Requested Entry, Reason, Attachment, Submitted At, Status, Approver, Actions.

Workflow:
`Submitted → Manager Review (if configured) → HR Review → Approved / Rejected / Needs Information`

- Employee submits correction request with reason and optional evidence.
- Manager sees only assigned team's requests if manager approval is required.
- HR reviews the request and source record.
- Approver must not approve their own correction request.
- On approval, backend updates the authorized attendance summary and preserves the original event and full audit history.
- Payroll preview should use the approved correction if the payroll period is still open.
- Finalized payroll must not be silently changed; corrections after finalization require a controlled adjustment/reopen workflow.

## Attendance Rule Settings

Authorized HR/Admin settings:
- Attendance method: camera required, optional, disabled.
- Grace period.
- Late mark threshold.
- Half-day threshold.
- Minimum hours for full day.
- Break policy.
- Early checkout policy.
- Missing checkout handling.
- Overtime eligibility.
- Work from home/on-duty rules.
- Geofence setting if enabled.
- Image retention period and access policy.

Rules should be effective-dated and their changes audited.

# 7.4 HRMS > Shifts & Rosters

## Shift Master

Fields:
- Shift name and code.
- Start time and end time.
- Cross-midnight option.
- Grace period.
- Break start/end or total allowed break.
- Full-day and half-day thresholds.
- Late/early calculation rule.
- Overtime rule reference.
- Applicable branch, team, department, or employee group.
- Effective from/to dates.
- Active/inactive status.

Buttons: Add Shift, View, Edit, Duplicate, Archive.

## Shift Assignments

Table columns: Employee, Department, Current Shift, Weekly Off, Effective From, Effective To, Assigned By, Actions.

Functions:
- Assign one employee.
- Bulk assign to selected employees.
- Schedule future shift changes.
- Import validated roster file.
- View assignment history.

## Roster Calendar

Managers/HR can view permitted staff schedules by day/week/month. Drag-and-drop changes must be permission-checked, confirmed, and audited. Send real-time updates to affected employees and managers.

# 7.5 HRMS > Leave Management

## Leave Dashboard

Widgets:
- Pending requests.
- Approved today.
- Employees on leave today.
- Upcoming leave.
- Leave balance alerts.
- Team availability (scope-controlled).

## Leave Applications

Employee form:
- Leave type.
- Start date and end date.
- Full day / half day / hourly option where enabled.
- Reason.
- Supporting attachment if required.
- Contact during leave (optional).
- Submit button.

Before submission, show an indicative working-day count using the current approved holiday and weekly-off calendar. The backend must recalculate and validate it at submission.

## Approval Queue

Columns: Request ID, Employee, Leave Type, From/To, Working Days, Reason summary, Submitted On, Current Approver, Status, Actions.

Actions: View, Approve, Reject, Request Changes, Reassign/Delegate if authorized.

Approval flow is configurable, e.g. Manager → HR or HR only. The user cannot approve their own leave. Any action requires a comment when configured. Notify the employee after each decision.

## Leave Calendar

- Month, week, and agenda views.
- Show company holidays and approved leave separately.
- Team availability view for authorized managers.
- Filter by department, team, branch, and leave type.
- Respect employee privacy settings; show only the detail that the viewer is allowed to see.

## Leave Balances and Policies

HR can configure:
- Leave type.
- Annual entitlement.
- Accrual frequency.
- Carry-forward rule.
- Expiry rule.
- Probation eligibility.
- Half-day support.
- Negative balance rules.
- Paid/unpaid classification.
- Applicable employees/branches.

Leave balance ledger must record opening balance, accrued, used, adjusted, expired, and closing balance. Do not overwrite historical transactions.

# 7.6 HRMS > Holiday Management

This page is especially important and must include both a **calendar view and a table view**.

## Holiday Calendar screen

Top bar:
- Page title: Holiday Management.
- Add Holiday button (permission: HRMS.Holidays.Create).
- Calendar mode selector: Month / Week / Agenda.
- Year selector and previous/next controls.
- Filters: Branch, Location, Department, Employee Group, Holiday Type, Status.
- Legend: Public/Company Holiday, Optional Holiday, Weekly Off, Special Working Day.

Calendar card:
- Show holiday name on the date.
- Distinguish holiday types with consistent accessible colours and labels.
- Clicking a holiday opens a side drawer with details and actions permitted to the user.
- Clicking an empty date may open Add Holiday prefilled with that date if the user has Create permission.
- Changing month/year must update the calendar from the backend.

## Holiday List / Table screen

Required columns:
- Holiday ID.
- Holiday Name.
- Date / Date Range.
- Day.
- Holiday Type.
- Paid / Unpaid classification.
- Applicable Branch / Location.
- Applicable Departments / Employee Groups.
- Description.
- Status.
- Created By.
- Last Updated.
- Actions.

Top controls:
- **+ Add Holiday** button.
- Search by holiday name.
- Year/date range filter.
- Type filter.
- Branch/location filter.
- Department/group filter.
- Active/Archived filter.
- Export (permission-controlled).

Row actions:
- View.
- Edit.
- Delete/Archive.
- Duplicate (optional).
- View Audit History.

## Add / Edit Holiday form

Fields:
1. Holiday Name (required).
2. Holiday Date (required) or From Date / To Date for a multi-day event.
3. Holiday Type: Public, Company, Optional, Regional, Special Working Day, or configurable type.
4. Paid Classification: Paid / Unpaid / Policy Based.
5. Applicable Branch / Location.
6. Applicable Department(s) / Employee Group(s) / All eligible employees.
7. Description / Notes.
8. Attachment (optional).
9. Status: Active / Inactive.

Buttons:
- Save Holiday.
- Save & Add Another (optional).
- Cancel.

Validation:
- Prevent duplicate or conflicting holiday records for the same scope/date unless the configuration explicitly allows them.
- Confirm before applying a holiday to a large employee group.
- Warn if the holiday affects a published roster, approved leave calculation, or open payroll period.
- Never silently rewrite finalized payroll. Historical payroll keeps its frozen calculation snapshot.

## Delete / Archive behaviour

- Ask for confirmation and show the holiday name and date.
- Require a reason for archive/delete where policy requires.
- Prefer archive if any attendance, leave, or payroll record references the holiday.
- If a holiday is already used by a finalized payroll, disable hard delete and direct an authorized user to a controlled correction process.
- Record before/after data, actor, reason, and timestamp in audit history.

## Weekly-Off Rules

Weekly offs are managed separately from one-time holidays. Support:
- Fixed Sunday or other fixed weekly off.
- Multiple weekly offs.
- Rotating weekly offs.
- Branch/department/shift-specific weekly offs.
- Effective date ranges.
- Special working days.
- Compensatory off policy.

Display weekly offs in the calendar but do not count them as unpaid absence by default.

# 7.7 HRMS > Payroll & Salary

Payroll must be a controlled financial workflow with clear access boundaries, version history, maker-checker approvals, and transparent calculations.

## Payroll Dashboard

Cards:
- Current Payroll Period.
- Draft Payroll Runs.
- Pending Approval.
- Finalized Payroll.
- Total Gross Earnings.
- Total Deductions.
- Total Net Pay.
- Payroll Exceptions.

Charts/tables:
- Month-wise payroll cost.
- Department-wise totals (if permitted).
- Recent payroll runs.
- Employees missing required payroll data.
- Pending approval actions.

An Employee dashboard must not display company payroll totals. Employee self-service shows only their own allowed salary data.

## Salary Components

HR/Payroll user with configuration permission can create components:
- Basic.
- HRA.
- Conveyance/Transport.
- Medical/other allowance.
- Special allowance.
- Incentive/commission.
- Overtime earning.
- Bonus/arrears.
- Employee-side deductions.
- Advance/loan recovery.
- Statutory/tax components as configured for jurisdiction.
- Employer contributions tracked separately from take-home salary.

For each component define:
- Name and code.
- Earning or deduction.
- Fixed / percentage / formula-driven / variable.
- Tax treatment where configured.
- Attendance-prorated or not.
- Included/excluded from LOP divisor.
- Effective date.
- Applicable employee group.
- Display order on payslip.

Do not hardcode legal tax or statutory percentages. Keep them configurable and reviewed for the organization's jurisdiction.

## Salary Templates

Create reusable salary structures, such as Junior Staff, Executive, Manager, HR Manager, or custom templates. Templates are starting points; final salary assignments are employee-specific and effective-dated.

## Employee Salary Assignments

Table columns:
- Employee ID.
- Employee Name.
- Department / Designation.
- Salary Template.
- Monthly Gross / CTC (if configured).
- Effective From.
- Current Status.
- Last Revised By.
- Approval Status.
- Actions.

Actions:
- View Salary Details.
- Create Assignment.
- Edit Draft.
- Submit Revision.
- View Revision History.
- Export only with sensitive export permission.

### Salary assignment form

- Select employee.
- Select template or Create Custom Structure.
- Effective from date.
- Salary frequency.
- Earnings components and amounts/formulas.
- Deductions and recovery components.
- Employer contributions.
- Payment method/reference information (restricted and stored securely).
- Notes and reason for revision.
- Preview gross, deductions, and estimated net salary.
- Submit for approval.

**Approval rule:** HR can prepare a salary assignment if granted permission; a different authorized reviewer must approve it when maker-checker is enabled. A user must not approve their own salary change. The employee may view their own approved salary summary only if that self-service permission is enabled. The Employee cannot edit their salary directly.

## Payroll Periods

Create payroll period with:
- Period name.
- Start date / end date.
- Payment date (planned/actual).
- Organization/branch/employee scope.
- Payroll divisor policy.
- Status: Open, Processing, Pending Approval, Finalized, Closed.

Prevent duplicate payroll runs for the same employee and period unless an authorized adjustment/re-run process is used.

## Run Payroll workflow

1. HR chooses payroll period and eligible employees/branches.
2. Backend fetches approved salary assignments effective during the period.
3. Backend fetches approved attendance, shifts, leave, holidays, weekly offs, overtime, approved incentives, and authorized recoveries.
4. System calculates payable days, paid leave, unpaid leave/LOP, holiday days, weekly offs, earnings, deductions, and net pay.
5. Payroll Exceptions screen identifies missing attendance, missing salary, incomplete bank details (only shown to authorized users), pending corrections, unapproved leave, or invalid component values.
6. HR reviews employee-wise preview and formula explanation.
7. HR resolves source issues through the correct module or marks an allowed exception with a reason.
8. HR submits the payroll run for approval.
9. Authorized approver reviews summary, employee lines, exception log, and changes.
10. Approver approves or returns it for correction.
11. Authorized payroll user finalizes the run.
12. Payslips are generated and released according to policy.
13. Payment status is recorded/imported through a verified process.
14. Payroll period is closed and locked.

## Payroll Preview table

Columns:
- Employee ID / Name.
- Department / Designation.
- Salary basis.
- Scheduled working days.
- Worked/present days.
- Paid leave days.
- Unpaid leave / LOP days.
- Paid holidays.
- Weekly offs.
- Late/early deduction (only if policy allows).
- Overtime / variable earnings.
- Gross earnings.
- Employee deductions.
- Advance / loan recovery.
- Net pay.
- Exception count.
- Line status.

Open an employee line to see the calculation breakdown and source records used. This is essential to answer the employee's question: “How much salary was cut and why?”

## Payroll calculation policy

- Do not treat public holidays or scheduled weekly offs as unpaid absence by default.
- Use the organization's approved payroll divisor: calendar-day, scheduled-working-day, or another approved method.
- Keep policy effective dates and store a calculation snapshot in the payroll line.
- Each salary component must state whether it is prorated by attendance.
- Paid leave, unpaid leave, half-days, absence, overtime, and recoveries must be treated according to policy.
- Do not mix incompatible divisor rules inside one payroll run.
- Show the formula and exact number of days used.
- Recalculate preview when a valid source record changes before finalization; show that the preview changed.
- Once finalized, preserve the calculation snapshot. Any correction must be performed through a controlled adjustment or reopen process with audit logs.

## Payslip Management

HR/Payroll with access can:
- View payslips.
- Release payslips after finalization.
- Download/print payslips.
- Reissue a payslip only through a logged action.
- View delivery status if an email provider is configured.

Employee self-service:
- View only own released payslips.
- Download PDF.
- See earnings, deductions, paid days, LOP days, paid holidays, and weekly offs.
- See clear deduction reasons and policy basis.
- Raise payroll query/ticket if enabled.

Payslip must show organization details, employee information, payroll period, earnings, deductions, gross, net, attendance days, payment information where permitted, and authorized sign-off area.

## Payroll Approval Queue

Table: Run ID, Period, Employee Count, Gross Total, Deduction Total, Net Total, Prepared By, Submitted Date, Exception Count, Status, Actions.

Actions: Review, View Exceptions, Approve, Reject/Return, Add Comment, View Audit Trail. Approver cannot approve a run that they prepared when maker-checker is enabled.

## Payroll Reports

- Payroll register.
- Department/branch payroll summary.
- Employee payslip history.
- Attendance-linked deduction report.
- LOP summary.
- Salary revision report.
- Payroll payment status.
- Payroll exception report.

Restrict reports and exports containing individual salaries or bank information with separate permissions.

# 7.8 HRMS > Recruitment, Performance, and Assets (Optional Extensions)

These modules can appear in the sidebar only when enabled.

**Recruitment:** job requisitions, candidate pipeline, interviews, evaluation, offer generation, joining conversion to employee. Converting a hired candidate should create/link one employee record and preserve candidate history.

**Performance:** employee goals, KPI assignment, manager review, self-review, HR review, appraisal recommendations, and approved salary revision request. Performance scores must not change salary automatically.

**Assets:** asset master, assignment to employee, issue/return, condition, maintenance, and exit clearance. Link asset records to employee exit checklist.

---

# 8. CRM & Sales — Detailed Sidebar Screens and Workflows

# 8.1 CRM Dashboard

Show leads, customers, pipeline, sales activities, and follow-ups within the user's assigned data scope.

Cards:
- Total Leads.
- New Leads.
- Unassigned Leads (for users permitted to assign/view them).
- Open Opportunities.
- Pipeline Value.
- Won This Month.
- Lost This Month.
- Follow-Ups Due Today.
- Overdue Follow-Ups.

Charts:
- Leads by source.
- Leads by stage.
- Opportunity value by stage.
- Monthly conversion trend.
- Salesperson performance where permitted.

# 8.2 CRM > Leads

Tabs:
- All Leads.
- My Leads.
- Unassigned Leads.
- New.
- Contacted.
- Qualified.
- Converted.
- Lost / Disqualified.

Table columns:
- Lead ID.
- Contact Name.
- Company.
- Phone / Email (permission-aware).
- Lead Source.
- Interested Product/Service.
- Stage.
- Estimated Value.
- Assigned To.
- Next Follow-Up.
- Last Activity.
- Actions.

Buttons:
- Add Lead.
- Import Leads.
- Export Leads.
- Assign Leads (bulk, permission-controlled).

### Add Lead form
- Person name.
- Company name.
- Mobile and email.
- Website.
- Country, state, city, address.
- Source.
- Interested product/service.
- Estimated deal value and currency.
- Priority.
- Stage.
- Assigned salesperson/team.
- Expected close date.
- Notes and attachment.

Duplicate check should warn for matching email/phone/company according to organization rules. Do not silently merge records. Allow an authorized user to review possible duplicates.

### Lead detail page
Tabs: Overview, Contact, Activities, Follow-Ups, Opportunity, Quotations, Documents, Notes, Activity History.

Actions: Edit, Assign, Create Follow-Up, Log Call, Schedule Meeting, Convert to Customer, Convert to Opportunity, Mark Lost, Archive.

### Lead conversion workflow
1. Sales qualifies the lead.
2. User selects Convert.
3. System checks whether a matching customer/contact already exists.
4. User confirms whether to link to the existing customer or create a new customer.
5. System creates/links the customer and contact.
6. System optionally creates an opportunity.
7. Lead history, activities, files, and ownership remain linked.
8. CRM dashboard and assigned user view update in real time.

# 8.3 CRM > Customers & Contacts

Customer Directory columns:
- Customer Code.
- Customer/Business Name.
- Customer Type.
- Primary Contact.
- Mobile / Email.
- Country / City.
- Assigned Account Manager.
- Total Invoiced.
- Amount Received.
- Outstanding (only if finance permission allows).
- Status.
- Actions.

Customer profile tabs:
1. Overview.
2. Contacts.
3. Opportunities.
4. Quotations.
5. Sales Orders (if enabled).
6. Invoices.
7. Payments.
8. Statements / Ledger (finance permission).
9. Activities and Follow-Ups.
10. Documents.
11. Notes and Audit History.

Customer fields:
- Customer code.
- Individual/company type.
- Legal and display name.
- Contact persons and roles.
- Email, phone, website.
- Billing and shipping/service addresses.
- GSTIN/tax number and registration details where relevant.
- Country, currency, place of supply where applicable.
- Customer category/tags.
- Assigned owner.
- Credit limit and payment terms (restricted).
- Notes and attachments.

# 8.4 CRM > Opportunities and Pipeline

Provide both:
- Kanban board grouped by pipeline stage.
- Searchable table view.

Default example stages (customizable):
`New → Contacted → Qualified → Proposal / Quotation → Negotiation → Won / Lost`

Opportunity fields:
- Opportunity ID and name.
- Linked customer/contact.
- Source lead.
- Pipeline and stage.
- Amount and currency.
- Probability.
- Expected close date.
- Owner and team.
- Products/services.
- Competitor (optional).
- Next action/follow-up.
- Lost reason.

Drag-and-drop stage changes must call the backend, confirm authorization, save stage history, and update related dashboards in real time. Do not allow a user to drag a record into a stage they are not authorized to use.

When an opportunity becomes Won:
- Record the close date and final value.
- Allow creation of quotation, sales order, or invoice according to company workflow.
- Maintain all linked records.

When Lost:
- Require a lost reason if configured.
- Keep history for reports; do not permanently delete the opportunity.

# 8.5 CRM > Follow-Ups & Activities

Today's Follow-Ups table:
- Time.
- Lead/customer.
- Related opportunity.
- Activity type.
- Assigned user.
- Priority.
- Status.
- Actions.

Overdue Follow-Ups:
- Display overdue duration and allow reschedule/complete with outcome.

Activity types:
- Call.
- Meeting.
- Email.
- WhatsApp (only through configured integration or manual note).
- Site visit.
- Demo.
- General note.

Actions:
- Log Activity.
- Complete Follow-Up.
- Reschedule.
- Reassign (if permitted).
- Add Notes / Attachment.

A follow-up can create an in-app notification and optionally email/SMS/WhatsApp reminders if that provider is configured. Show delivery state honestly.

# 8.6 CRM > Sales Tasks

Task form:
- Title.
- Related lead/customer/opportunity.
- Assigned employee/team.
- Priority.
- Start date and due date.
- Checklist.
- Description.
- Attachment.
- Reminder.

Views: My Tasks, Team Tasks, Due Today, Overdue, Completed, Kanban, Calendar. Managers see tasks for their assigned teams only.

# 8.7 CRM > Quotations and Sales Connection

A salesperson can create a quotation from an opportunity or customer if granted Create permission. The quotation must carry the linked customer, address, line items, pricing, discount, tax configuration, and opportunity reference.

When accepted, the user with the right permissions can convert it to an invoice or sales order. The system must retain source references and must not create duplicate customers or duplicate line items without confirmation.

---

# 9. Billing & Finance — Detailed Sidebar Screens and Workflows

# 9.1 Finance Dashboard

Cards:
- Sales This Month.
- Invoice Total.
- Received Amount.
- Outstanding Receivables.
- Overdue Invoices.
- Pending Invoice Approval.
- Expenses This Month.
- Net Cash Movement (only if supported by real recorded financial data).

Charts:
- Monthly sales/revenue.
- Payments received.
- Outstanding ageing.
- Expenses by category.

# 9.2 Products & Services

Table columns: Item Code, Name, Type, Category, Unit, Selling Price, Tax Category, Active Status, Actions.

Form fields:
- Item/service code.
- Name.
- Description.
- Product/service type.
- Category.
- Unit of measure.
- Selling price.
- Tax category.
- HSN/SAC or local classification where applicable.
- Discount rules.
- Stock tracking link if inventory is enabled.
- Active/inactive.

Purchase cost and margin are separate sensitive fields. Sales users should not see them unless authorized.

# 9.3 Quotations & Estimates

Table tabs: All, Draft, Pending Approval, Sent, Accepted, Rejected, Expired, Converted.

Quotation form:
- Customer.
- Quotation number (generated by configured sequence).
- Date and validity date.
- Linked lead/opportunity.
- Billing address.
- Line items: product/service, description, quantity, unit, rate, discount, tax.
- Subtotal, discount total, taxes, round-off, grand total.
- Terms and conditions.
- Notes and attachments.

Buttons:
- Save Draft.
- Preview PDF.
- Submit for Approval (if configured).
- Approve.
- Send (only if email integration is configured).
- Mark Accepted / Rejected where policy permits.
- Convert to Invoice / Sales Order.
- Duplicate.
- Cancel / Archive.

Sent quotations must preserve their revision history. Editing a sent quotation should create a revision rather than silently change the earlier version.

# 9.4 Invoices

Invoice list tabs:
- All Invoices.
- Draft.
- Pending Approval.
- Approved.
- Issued / Sent.
- Partially Paid.
- Paid.
- Overdue.
- Cancelled.

Table columns:
- Invoice Number.
- Customer.
- Invoice Date.
- Due Date.
- Invoice Total.
- Amount Received.
- Outstanding.
- Status.
- Created By.
- Actions.

### Create Invoice flow
1. Choose customer or open from accepted quotation/sales order.
2. Load customer billing information.
3. Add items/services and quantity.
4. Apply permitted discounts and tax rules.
5. Preview subtotal, tax breakdown, round-off, and total.
6. Add payment terms, due date, notes, and attachment.
7. Save draft.
8. Submit for approval if required.
9. Authorized user approves and issues invoice.
10. Generate a fixed invoice PDF and preserve issued version.
11. Send invoice only when a configured email/SMS delivery provider is available.
12. Record payments and update balance.

### Invoice detail page
Tabs: Overview, Items & Tax, Payments, Customer, Documents, Activity, Approval History.

Actions: Edit Draft, Approve, Issue, Download PDF, Print, Send, Add Payment, Create Credit Note, Cancel/Void, View Audit History.

Issued invoice amounts and tax details must not be casually edited. Use a credit note/debit note or approved amendment process where applicable. Cancellation must require a reason and appropriate permission.

# 9.5 Payments and Receipts

Payment list columns:
- Payment ID.
- Customer.
- Date.
- Amount.
- Payment Mode.
- Transaction Reference.
- Allocated Invoice(s).
- Verification Status.
- Recorded By.
- Actions.

Add Payment form:
- Customer.
- Payment date.
- Amount.
- Payment mode.
- Transaction/reference number.
- Bank/account (restricted).
- Invoice allocation(s).
- Attachment/proof.
- Notes.

Support partial payments, one payment allocated across multiple invoices where configured, and unallocated advance payments. Keep allocation history.

Payment statuses: Pending Verification, Verified, Rejected, Refunded, Reversed (use only statuses supported by the payment workflow).

On verified payment:
- Update invoice amount received and outstanding.
- Update customer balance/ledger.
- Generate receipt.
- Notify authorized Accounts users and assigned salesperson where appropriate.
- Update finance dashboard and overdue logic in real time.

Do not mark a gateway payment as paid merely because the customer returned to the website. Use verified provider webhooks/status responses, or clearly labelled authorized manual confirmation.

# 9.6 Customer Ledger / Statement

Show transactions chronologically:
- Opening balance (where maintained).
- Invoices.
- Credit notes.
- Payments.
- Refunds.
- Adjustments.
- Running balance.

Allow PDF/CSV export only under permission. Sales staff may see invoice status or outstanding summary without necessarily seeing full financial details.

# 9.7 Expenses

Expense list filters: Date, Category, Branch, Submitted By, Vendor, Approval Status, Payment Status.

Expense form:
- Expense date.
- Category.
- Description.
- Vendor/payee.
- Amount and currency.
- Tax details where applicable.
- Payment mode/account.
- Branch/project (optional).
- Receipt upload.
- Recurring expense setting (optional).

Workflow:
`Draft → Submitted → Manager Approval (if configured) → Accounts Review → Approved → Paid / Rejected`

A user cannot approve their own expense claim when maker-checker is enabled. Accounts can record payment after approval. Keep receipt attachments private.

# 9.8 Tax Centre

- Tax categories/rates.
- GST details where applicable.
- HSN/SAC references.
- CGST/SGST/IGST handling for India configuration.
- Tax-inclusive/exclusive pricing.
- Place of supply.
- Effective dates and change history.
- Tax summary reports.

Do not claim automatic statutory filing unless a verified filing integration is implemented and tested.

# 9.9 Finance Reports

- Sales register.
- Invoice register.
- Payment register.
- Receipt register.
- Outstanding receivables.
- Ageing report.
- Customer statement.
- Quotation conversion.
- Product/service sales.
- Tax summary.
- Expense register.
- Revenue and expense summary.
- Branch/customer/salesperson breakdown.

All exports must follow the same permissions and data scope as the screen.

---

# 10. Inventory & Purchase — Detailed Sidebar Screens

This is an optional but recommended supporting module. It must be connected to Products & Services, Purchase, Billing, and Finance when enabled.

## 10.1 Inventory Dashboard

Cards:
- Total SKUs.
- Total Stock Quantity.
- Low Stock Items.
- Out of Stock Items.
- Pending Stock Transfers.
- Pending Goods Receipts.
- Purchase Orders Awaiting Approval.

## 10.2 Product / SKU Master

Fields:
- SKU code.
- Product name.
- Category.
- Unit.
- Barcode (optional).
- Tax classification.
- Reorder level.
- Preferred supplier.
- Warehouse defaults.
- Active status.

Link SKU to the billing Product/Service record when the same item is sold. Do not create a separate duplicate item unnecessarily.

## 10.3 Stock Overview

Table columns: SKU, Product, Warehouse, Available, Reserved, In Transit, Reorder Level, Stock Value (restricted), Status, Actions.

Actions: View Movement, Transfer, Adjust Stock, Purchase Request.

## 10.4 Warehouses

Create warehouse/location with code, address, branch, manager, contact, active status. Restrict each storekeeper to assigned warehouses.

## 10.5 Stock In / Stock Out

Every movement must have a source document and reason. Examples:
- Goods received from purchase order.
- Sales dispatch.
- Internal consumption.
- Damaged stock.
- Return.
- Manual adjustment.

Record quantity, unit, warehouse, date, reference, actor, and approval if required. Do not allow unexplained negative stock unless company policy specifically permits it.

## 10.6 Stock Transfers and Adjustments

Transfer workflow:
`Draft → Requested → Approved → Dispatched → Received → Completed`

Adjustment workflow requires reason, evidence if applicable, and approval above configured thresholds. Maintain a complete stock movement ledger.

## 10.7 Purchase Requests and Purchase Orders

Purchase Request fields: requester, item, quantity, needed-by date, purpose, warehouse, estimate, attachment.

Purchase Order fields: supplier, items, quantity, unit rate, tax, expected delivery, payment terms, delivery location, approval, terms.

Workflow:
`Purchase Request → Approval → Purchase Order → Goods Received Note → Purchase Bill → Supplier Payment`

## 10.8 Goods Received Notes (GRN)

Receive against a purchase order. Record ordered vs received quantity, accepted/rejected quantity, batch/serial/expiry details if needed, and attachment. Update stock only after authorized receipt confirmation.

## 10.9 Purchase Bills and Supplier Payments

Link purchase bill to supplier and GRN. Track due date, amount, tax, payment, and outstanding. Supplier payments must update vendor payable balances and cash/bank records where implemented.

---

# 11. Projects & Operations — Detailed Sidebar Screens

## Projects Dashboard
- Active projects.
- Projects at risk/overdue.
- Tasks due today.
- Overdue tasks.
- Team workload.
- Project completion trend.

## All Projects / My Projects
Project fields:
- Project code/name.
- Customer (optional).
- Owner/manager.
- Team members.
- Start/end dates.
- Budget (sensitive if needed).
- Status.
- Milestones.
- Description and attachments.

## Project detail tabs
- Overview.
- Tasks.
- Milestones.
- Team.
- Calendar.
- Time Logs (optional).
- Documents.
- Comments.
- Activity.
- Billing links where applicable.

## Tasks & Subtasks
Task fields: title, description, project, assigned employee, priority, start/due date, status, checklist, attachment, comments, dependency.

Task statuses: Not Started, In Progress, On Hold, Review, Completed, Cancelled.

Managers see tasks within their team scope. Employees see tasks assigned to them or shared with them. Task updates must appear in authorized dashboards and notifications in real time.

---

# 12. Documents Centre

Sidebar screens:
- Document Centre.
- My Documents.
- Shared With Me.
- Templates.
- Expiring Documents.

Functions:
- Upload document.
- Create folder/category.
- Search by title, category, tags, owner, related record.
- Preview/download based on permissions.
- Version history.
- Share with selected users/roles/teams if allowed.
- Set expiry date and reminder.
- Archive document.
- View access history for sensitive files.

A document linked to an employee, customer, invoice, project, or ticket must respect both document permissions and the linked record's access policy. Store private files in protected storage and serve downloads through authorization checks and short-lived links.

---

# 13. Communication, Notifications, Announcements, and Helpdesk

## 13.1 Notification Centre

Notification types:
- Attendance confirmation.
- Leave submitted/approved/rejected.
- Attendance correction status.
- Shift changed.
- Holiday added/changed.
- Payslip released.
- Task assigned/due/overdue.
- Lead assigned.
- Follow-up due.
- Quotation approved/accepted.
- Invoice issued/overdue.
- Payment verified.
- Approval requested.
- Role or security event.

Notification centre features:
- All / Unread tabs.
- Filter by module/type/date.
- Mark as read.
- Mark all as read.
- Open related record.
- Notification preferences.

Each user receives only notifications they are authorized to receive. Never include salary, bank details, private documents, or excessive customer information in a push/toast message.

## 13.2 Announcements

Authorized HR/Admin users can create announcement with title, content, audience, branch/department/role, publish time, expiry time, and attachment. Employees can view announcements targeted to them. Optional acknowledgement tracking should show who has acknowledged without exposing unrelated private data.

## 13.3 Helpdesk / Support Tickets

Categories: HR, IT, Admin, Finance, Facilities, Other.

Ticket form:
- Category.
- Subject.
- Description.
- Priority.
- Attachment.
- Related record (optional).

Ticket statuses: Open, Assigned, In Progress, Waiting for User, Resolved, Closed, Reopened.

Employee sees own tickets. Support team sees assigned tickets or queue according to permission. Every status/comment change is stored and notified to relevant people.

---

# 14. Reports & Analytics

The Reports sidebar must not become a place where all records are exposed. Each report uses the same permission and data-scope checks as the relevant module.

Report categories:
- Executive Overview.
- HRMS Reports.
- CRM & Sales Reports.
- Billing & Finance Reports.
- Inventory & Purchase Reports.
- Project & Task Reports.
- Custom Report Builder.
- Scheduled Reports.

Common report controls:
- Date range.
- Branch/department/team.
- Employee/salesperson/customer.
- Status.
- Grouping and sorting.
- View chart/table.
- Drill down to source records.
- Export CSV/XLSX/PDF if allowed.

Custom Report Builder must expose only approved fields. A user must not add salary, bank details, identity documents, or private customer fields unless they hold the relevant sensitive report permission.

Scheduled reports must be delivered only to authorized recipients. Recheck recipient permissions when the report is generated and when it is downloaded.

---

# 15. Administration — Detailed Sidebar Screens

Only users with the relevant administrative permissions should see each section. Do not assume all Sub-Admins can manage security or roles.

## 15.1 Admin Dashboard

Widgets:
- Total users and active users.
- Pending invitations.
- Suspended accounts.
- Active branches/departments.
- Role count.
- Recent permission changes.
- Recent security events.
- Integration status.
- Background job / system health status.

## 15.2 User Management

Table columns: User ID, Name, Login ID, Linked Employee, Roles, Branch, Status, Last Login, 2FA Status, Actions.

Actions:
- Invite/Create User.
- Edit User.
- Assign Roles.
- Assign Branch/Department/Data Scope.
- Activate/Suspend/Deactivate.
- Reset Password / Send Reset Link.
- Revoke Sessions.
- View Login History.

User creation flow:
1. Create or select linked employee record where applicable.
2. Enter login identifier and contact details.
3. Assign one or more existing roles.
4. Assign data scope (own, team, department, branch, organization) and specific scope members.
5. Set invitation/password policy.
6. Save and send invitation only when email service is configured.
7. Log the action.

Do not permit an administrator to grant permissions greater than their own delegated authority. Do not expose password values to any admin.

## 15.3 Roles & Permissions

Roles list:
- Role Name.
- Role Code.
- Description.
- Assigned Users.
- Status.
- Last Updated.
- Actions: View, Edit, Duplicate, Assign Users, Deactivate.

Role detail tabs:
- Overview.
- Permission Matrix.
- Data Scope.
- Assigned Users.
- Change History.

## 15.4 Permission Matrix

Matrix layout:
- Rows: Modules → Pages → Features.
- Columns: View, Create, Edit, Delete/Archive, Approve, Reject, Assign, Export, Print, Import, Configure, Sensitive Data, Finalize/Process.

Required tools:
- Search permission.
- Expand/collapse modules.
- Select all within one page/module.
- Copy from another role.
- Compare two roles.
- Reset to saved role template.
- Save changes.
- View impact/users affected.

Separate action permissions from data scope. Example: a Manager might have View Team Attendance but not View All Attendance. An HR user might have View Employee Records but not View Salary. A Sales user might have View Customer but not View Customer Credit Limit.

Before saving:
- Show a summary of permissions added and removed.
- Warn if active users will lose access.
- Require confirmation for high-risk permissions.
- Log actor, time, old permissions, new permissions, and reason.
- Invalidate affected permission caches and WebSocket memberships immediately after successful commit.

## 15.5 Access Review

Provide a searchable list of users, roles, sensitive permissions, scope, last login, and access status. Allow authorized administrators to review and remove unnecessary access. Record reviewer and review date.

## 15.6 Organization Profile

Settings:
- Company name and legal name.
- Logo and brand assets.
- Registered and operating addresses.
- Contact information.
- Tax/registration identifiers.
- Financial year.
- Currency.
- Time zone.
- Date/time format.
- Default language.
- Number format.
- Document footer and signature settings.

## 15.7 Branches / Locations

Branch list: Branch Code, Name, Address, Time Zone, Manager, Departments, Status, Actions.

Branch settings may include work hours, holiday calendar, weekly-off policy, attendance/geofence rule, invoice sequence, and user data scope.

## 15.8 Departments and Designations

Department: code, name, branch, head, parent department, status.

Designation: code, name, grade/level, department mapping, status.

Changes must not break historical employee reporting or payroll records. Preserve effective dates where needed.

## 15.9 Approval Workflows

Create configurable workflows for:
- Leave approval.
- Attendance correction.
- Salary revision.
- Payroll approval.
- Expense approval.
- Purchase request/order approval.
- Invoice approval/cancellation.
- Stock adjustment.

Workflow builder fields:
- Workflow name and module.
- Trigger condition.
- Applicable branch/department/amount range/employee group.
- Approval steps and order.
- Approver role or specific approver.
- Parallel or sequential approval.
- Required comments/attachments.
- Escalation timing.
- Delegate/backup approver.
- Effective date and active status.

Prevent circular approval chains and prevent self-approval where maker-checker applies. Keep workflow version history. A change in workflow should not silently change an already submitted approval unless an authorized migration is performed.

## 15.10 Module Management

Enable/disable optional modules such as Recruitment, Performance, Inventory, Purchase, Projects, Helpdesk, or Campaigns. Disabling a module must not delete historical records. Hide its menu from users and preserve data. Warn when a module is used by another active workflow.

## 15.11 Custom Fields

Allow safe custom fields for selected modules (e.g. Employee, Lead, Customer, Project). Field types: text, number, date, dropdown, checkbox, URL, file reference. Configure required, searchable, visible roles, and form section. Validate custom fields on the backend. Avoid allowing arbitrary executable formulas or scripts.

## 15.12 Integrations

Configuration screens for:
- SMTP/email provider.
- SMS provider.
- WhatsApp provider.
- Payment gateway.
- Cloud/private file storage.
- Maps/geolocation (if used).
- Accounting export/integration.
- Identity/SSO (optional).

Each integration page must show:
- Status: Not Configured / Connected / Error / Disabled.
- Required credentials and callback URLs.
- Test Connection button.
- Last successful sync / last error.
- Enable/Disable controls.

Store secrets securely. Never echo full secrets back into the UI. Do not show “Sent”, “Paid”, or “Connected” without provider confirmation.

## 15.13 Security & Login Settings

- Password policy.
- Session lifetime.
- Failed login limit.
- Temporary lockout.
- Optional/required 2FA.
- Allowed login identifier types.
- Session/device list.
- Revoke session.
- IP/device alerts where lawful and configured.
- Login audit history.

## 15.14 Audit Logs

Filters: actor, module, action, record ID, date range, branch, severity.

Columns: Time, Actor, Action, Module, Record, Reason, Source/IP metadata where configured, View Details.

Audit log must be append-only for normal users. Sensitive before/after values should be masked or excluded when not necessary. No ordinary admin should be able to quietly erase history.

## 15.15 Data Import / Export

Import process:
1. Download the correct template.
2. Upload CSV/XLSX.
3. Validate headers and values.
4. Show preview and row-level errors.
5. Confirm import.
6. Process in background for large files.
7. Provide import result and error file.
8. Log uploader and result.

Export process:
- Check Export permission and data scope.
- Select fields permitted to the user.
- Warn about sensitive data.
- Generate report in background if large.
- Provide secure, expiring download.
- Log the export.

## 15.16 Backup, Data Retention, and System Health

Show last backup status, scheduled backup configuration, storage status, queue health, WebSocket/Redis status, error log summaries, and database health. Do not expose infrastructure secrets. Provide restore instructions to authorized operators; actual restore actions must require strong authorization and confirmation.

---

# 16. Login, User Identity, and Role/Permission Behaviour

## 16.1 One login page

Route: `/login`

Fields:
- Email / username / registered mobile (enabled identifiers only).
- Password.
- Show/hide password.
- Remember me if implemented securely.
- Forgot Password.
- Sign In.
- Optional 2FA step after successful primary authentication.

After login:
1. Backend authenticates the user.
2. Backend loads active user roles, effective permissions, data scopes, module access, and organization context.
3. Frontend fetches `/me` or equivalent session profile endpoint.
4. Frontend builds the shared sidebar and routes from permitted navigation metadata.
5. User lands on their authorized default dashboard.
6. If the user has multiple assigned roles and the company enables role switching, show the role selector.

## 16.2 Role switching is not privilege escalation

- The user may switch only to a role already assigned to that user.
- On switch, request new effective permissions from backend.
- Rebuild the sidebar and dashboard.
- Clear or refetch cached API data that might belong to the previous role scope.
- Reauthorize active pages and WebSocket subscriptions.
- Do not allow a client-side role name change to grant access.

## 16.3 Employee can view own salary

This must be permission-driven:
- Employee has `payroll.view_own_salary` and `payroll.view_own_payslip` to view own approved salary summary and released payslips.
- Employee does not receive `payroll.edit_salary`, `payroll.approve_salary`, `payroll.process_payroll`, or `payroll.view_all_salary`.
- HR may have `payroll.view_salary` or `payroll.edit_salary` only if separately granted.
- HR's own payslip remains available through own-record permission even if HR cannot view all employee salaries.
- An HR user cannot approve their own salary revision or be the final approver of their own payroll line when maker-checker is configured.
- Manager does not see team salary by default.
- Accounts receives only the payroll payment information necessary for its assigned work.

## 16.4 Route access and session changes

If a user's role or permission changes while they are logged in:
- Backend saves the permission change.
- Invalidate permission cache and relevant tokens/session authorization as appropriate.
- Notify the user's active sessions.
- Frontend refreshes `/me` and rebuilds the sidebar.
- If current page is no longer permitted, redirect to the user's authorized dashboard with a clear message.
- Reauthorize WebSocket groups and close connections that are no longer valid.

---

# 17. Real-Time Behaviour — What Updates Without Refreshing

Use Django Channels + authenticated WebSockets + Redis. The database is the source of truth. WebSockets notify the UI that authorized data changed; they do not replace durable API writes.

## 17.1 HRMS real-time examples

- Employee checks in → server saves event → HR Live Attendance updates → Manager's team count updates → Employee sees confirmed status → notification is recorded if configured.
- Employee checks out → attendance duration recalculates → authorized attendance table and dashboard update.
- Employee submits leave → Manager approval queue updates → HR pending count updates → employee sees Pending status.
- Manager approves leave → HR leave calendar updates → employee sees Approved status → leave balance and future availability recalculate.
- HR adds a holiday → employee calendars update → leave date preview recalculates → payroll preview updates only if the payroll period is still open and the holiday applies to that employee.
- HR changes a shift → employee schedule updates → attendance rules use the effective shift → manager roster updates.
- HR changes a salary draft → authorized reviewer sees pending revision → employee sees it only after approval and publication policy allows it.
- Payroll is finalized → payslips become available only after release → employee receives notification.

## 17.2 CRM real-time examples

- Lead created → assigned sales user sees it → team dashboard count updates.
- Lead assigned/reassigned → new owner receives notification; old owner loses record visibility if scope requires.
- Opportunity stage changed → Kanban, pipeline totals, forecast, and manager dashboard update.
- Follow-up due/overdue → assigned user sees badge and notification.
- Customer converted from lead → customer directory updates and lead history remains connected.

## 17.3 Billing real-time examples

- Quotation submitted → approver queue updates.
- Quotation accepted → CRM opportunity and quotation status update.
- Invoice issued → customer invoice list and finance dashboard update.
- Payment verified → invoice outstanding balance, customer ledger, receipt, and finance dashboard update.
- Invoice due date passes → overdue status changes through a scheduled backend job and notification is generated according to rules.

## 17.4 Permission and privacy rules for events

- Verify authenticated identity before WebSocket connection.
- Authorize group membership on the backend.
- Use record-specific or scope-specific channels where needed.
- Send minimal payload: event type, record identifier, timestamp, and safe status summary.
- Do not broadcast salary amounts, bank details, personal identity data, private notes, or document contents to broad groups.
- Recheck permissions on subscription and after role changes.
- Use transaction-safe dispatch after database commit.
- Deduplicate events and handle reconnects.
- When WebSocket disconnects, show connection status and use a safe API refetch/polling fallback.

## 17.5 Meaning of “real time”

The interface should update promptly after the backend confirms a committed change. Do not promise zero latency or pretend a request succeeded while it is still pending. Always show pending/saving/error states and use the server response as final confirmation.

---

# 18. Connected Data Flows Between Modules

The ERP should feel like one system, not independent tools joined only by a menu.

## 18.1 Employee → Attendance → Leave → Payroll

```text
Employee Record
   ├── Department / Branch / Manager
   ├── Shift + Weekly-Off Policy
   ├── Leave Policy + Holiday Calendar
   └── Approved Salary Assignment
            │
            ▼
       Attendance Events
            │
       Daily Attendance Summary
            │
       Approved Leave + Paid Holidays + Weekly Offs
            │
            ▼
       Payroll Preview and Exceptions
            │
       Review → Approval → Finalization
            │
       Payslip → Employee Self-Service
```

Source records should be linked. Payroll should read approved inputs, preserve a calculation snapshot, and never silently modify finalized history.

## 18.2 Lead → Customer → Opportunity → Quotation → Invoice → Payment

```text
Lead
  │ qualify / convert
  ▼
Customer + Contact
  │
  ▼
Opportunity / Pipeline
  │
  ▼
Quotation / Estimate
  │ accepted
  ▼
Sales Order (optional)
  │
  ▼
Invoice
  │
  ├── Partial Payment
  ├── Final Payment
  └── Receipt / Customer Ledger
```

Maintain source IDs and history at every stage. Do not retype or duplicate details unnecessarily.

## 18.3 Purchase → Inventory → Vendor Bill → Finance

```text
Purchase Request
  ▼
Approval
  ▼
Purchase Order
  ▼
Goods Received Note
  ▼
Stock Updated
  ▼
Purchase Bill / Vendor Payable
  ▼
Supplier Payment
```

Stock is updated only by approved receipts, dispatches, transfers, returns, or adjustments.

## 18.4 Employee → Project → Task → Performance

```text
Employee / Manager
  ▼
Project Assignment
  ▼
Task / Subtask
  ▼
Progress / Comments / Time Log
  ▼
Project Dashboard + Team Workload
  ▼
Performance Review Input (if enabled)
```

Task completion should not automatically change payroll or performance ratings without an explicitly configured approved rule.

---

# 19. Statuses and Button Behaviour Reference

Use consistent status naming across the ERP. If organization-specific statuses are allowed, map them to a standard workflow category.

| Record type | Suggested statuses |
|---|---|
| User | Invited, Active, Suspended, Deactivated |
| Employee | Draft, Pre-Joining, Probation, Active, Notice Period, Exited, Archived |
| Attendance | Not Started, Checked In, Checked Out, Present, Late, Half Day, Absent, On Leave, Holiday, Weekly Off, WFH, On Duty, Pending Correction |
| Attendance correction | Submitted, Manager Review, HR Review, Needs Information, Approved, Rejected |
| Leave | Draft, Submitted, Pending Approval, Approved, Rejected, Cancelled, Withdrawn |
| Holiday | Active, Inactive, Archived |
| Salary revision | Draft, Submitted, Pending Approval, Approved, Rejected, Effective, Superseded |
| Payroll run | Draft, Processing, Exceptions, Pending Approval, Approved, Finalized, Closed, Reopened (restricted) |
| Payslip | Draft, Generated, Released, Reissued, Voided (restricted) |
| Lead | New, Contacted, Qualified, Converted, Lost, Archived |
| Opportunity | New, Contacted, Qualified, Proposal, Negotiation, Won, Lost |
| Quotation | Draft, Pending Approval, Approved, Sent, Accepted, Rejected, Expired, Converted, Cancelled |
| Invoice | Draft, Pending Approval, Approved, Issued, Partially Paid, Paid, Overdue, Cancelled |
| Payment | Pending Verification, Verified, Rejected, Refunded, Reversed |
| Expense | Draft, Submitted, Pending Approval, Approved, Rejected, Paid |
| Purchase order | Draft, Pending Approval, Approved, Sent, Partially Received, Received, Closed, Cancelled |
| Support ticket | Open, Assigned, In Progress, Waiting for User, Resolved, Closed, Reopened |

## 19.1 Add button
- Opens a real creation form.
- Visible only with Create permission.
- Saves through backend API.
- Shows validation errors and success only after server response.

## 19.2 Edit button
- Visible only with Edit permission and only for editable states.
- For finalized or issued records, use an amendment/correction workflow.
- Show version history for important records.

## 19.3 Delete / Archive button
- Prefer archive/soft-delete for business records.
- Require confirmation and, where appropriate, a reason.
- Block hard deletion when referenced by finalized payroll, issued invoice, payment, or audit-critical records.

## 19.4 Approve / Reject buttons
- Require Approve/Reject permission and correct data scope.
- Show summary, source data, and previous approval steps before decision.
- Require comment where configured.
- Prevent self-approval when maker-checker rules apply.
- Record approver, timestamp, decision, and comment.

## 19.5 Export / Download buttons
- Require Export/Download permission.
- Respect record scope and field-level permissions.
- Mask/remove sensitive fields unless specific permission exists.
- Log the export and use protected, expiring download links.

---

# 20. Alerts, Empty States, and Error Handling

Create consistent messages for:

- No records found: explain and offer Add action only if user has Create permission.
- No permission: explain that access is not granted and direct the user to the administrator without exposing restricted information.
- Loading: show skeleton/loading state.
- Saving: disable duplicate submissions and show progress.
- Success: show the saved record or next action.
- Validation error: show the issue beside the relevant field.
- Network error: offer retry and preserve safe form input.
- WebSocket disconnected: show reconnecting status and use API refresh fallback.
- Integration not configured: show Not Configured and list required setup without pretending the operation was completed.
- Background job processing: show Pending/Processing and refresh job status.

For payroll, invoice issue, payment verification, role changes, and destructive actions, show a confirmation summary before the final action.

---

# 21. Suggested Frontend Route Map

Use a shared route prefix and route guards. Actual access must come from backend permissions. This list is a suggested route map, not permission grants.

```text
/login
/forgot-password
/reset-password

/app/dashboard
/app/workspace/profile
/app/workspace/attendance
/app/workspace/attendance/check-in
/app/workspace/leave
/app/workspace/holidays
/app/workspace/schedule
/app/workspace/payslips
/app/workspace/salary
/app/workspace/tasks
/app/workspace/documents
/app/workspace/requests

/app/hrms/dashboard
/app/hrms/employees
/app/hrms/employees/new
/app/hrms/employees/:id
/app/hrms/departments
/app/hrms/designations
/app/hrms/onboarding
/app/hrms/attendance/live
/app/hrms/attendance/register
/app/hrms/attendance/calendar
/app/hrms/attendance/corrections
/app/hrms/attendance/rules
/app/hrms/shifts
/app/hrms/shifts/assignments
/app/hrms/rosters
/app/hrms/leave
/app/hrms/leave/approvals
/app/hrms/leave/calendar
/app/hrms/leave/balances
/app/hrms/leave/policies
/app/hrms/holidays
/app/hrms/holidays/new
/app/hrms/payroll/dashboard
/app/hrms/payroll/components
/app/hrms/payroll/templates
/app/hrms/payroll/salary-assignments
/app/hrms/payroll/revisions
/app/hrms/payroll/periods
/app/hrms/payroll/run
/app/hrms/payroll/preview/:runId
/app/hrms/payroll/approvals
/app/hrms/payroll/finalized
/app/hrms/payroll/payslips
/app/hrms/payroll/reports
/app/hrms/recruitment
/app/hrms/performance
/app/hrms/reports

/app/crm/dashboard
/app/crm/leads
/app/crm/leads/new
/app/crm/leads/:id
/app/crm/customers
/app/crm/customers/:id
/app/crm/contacts
/app/crm/opportunities
/app/crm/pipeline
/app/crm/follow-ups
/app/crm/activities
/app/crm/tasks
/app/crm/quotations
/app/crm/reports

/app/finance/dashboard
/app/finance/items
/app/finance/quotations
/app/finance/quotations/:id
/app/finance/invoices
/app/finance/invoices/new
/app/finance/invoices/:id
/app/finance/payments
/app/finance/receipts
/app/finance/credit-notes
/app/finance/expenses
/app/finance/ledger
/app/finance/tax
/app/finance/reports

/app/inventory/dashboard
/app/inventory/products
/app/inventory/stock
/app/inventory/warehouses
/app/inventory/movements
/app/inventory/transfers
/app/inventory/adjustments
/app/purchase/requests
/app/purchase/orders
/app/purchase/grn
/app/purchase/bills
/app/purchase/suppliers
/app/purchase/payments

/app/projects/dashboard
/app/projects
/app/projects/:id
/app/tasks
/app/calendar

/app/documents
/app/documents/mine
/app/documents/shared
/app/documents/templates
/app/documents/expiring

/app/notifications
/app/announcements
/app/helpdesk
/app/helpdesk/:id
/app/reports
/app/reports/custom

/app/admin/dashboard
/app/admin/users
/app/admin/users/:id
/app/admin/roles
/app/admin/roles/:id
/app/admin/permissions
/app/admin/access-review
/app/admin/organization
/app/admin/branches
/app/admin/departments
/app/admin/designations
/app/admin/workflows
/app/admin/modules
/app/admin/custom-fields
/app/admin/numbering
/app/admin/settings
/app/admin/integrations
/app/admin/security
/app/admin/audit-logs
/app/admin/import-export
/app/admin/backups
/app/admin/system-health
```

For every route:
- Check authentication.
- Check page permission.
- Check data scope on the backend.
- Load only permitted fields and related records.
- Provide breadcrumbs and active sidebar state.
- Handle revoked permission during an open session.

---

# 22. Recommended Django Apps and Real-Time Event Names

Suggested Django app boundaries:

```text
backend/
  config/
  apps/
    accounts/
    organizations/
    access_control/
    hrms/
    attendance/
    leave_management/
    payroll/
    crm/
    billing/
    finance/
    inventory/
    purchase/
    projects/
    documents/
    notifications/
    helpdesk/
    reports/
    audit/
```

Suggested event names (names may be adapted, but use a consistent versioned event contract):

```text
hr.employee.created
hr.employee.updated
attendance.check_in.accepted
attendance.check_out.accepted
attendance.correction.submitted
attendance.correction.approved
leave.application.submitted
leave.application.approved
leave.application.rejected
holiday.created
holiday.updated
shift.assignment.updated
payroll.run.submitted
payroll.run.approved
payroll.run.finalized
payslip.released

crm.lead.created
crm.lead.assigned
crm.lead.converted
crm.opportunity.stage_changed
crm.follow_up.created
crm.follow_up.completed
crm.task.assigned

billing.quotation.submitted
billing.quotation.accepted
billing.invoice.issued
billing.invoice.overdue
billing.payment.verified
billing.payment.refunded

admin.user.status_changed
admin.role.updated
admin.permission.updated
admin.integration.status_changed
```

Each event must include a unique event ID, event version, event type, timestamp, organization ID, actor ID where suitable, entity type, entity ID, and minimal safe payload. Authorize recipients before sending. Do not expose sensitive values through broadcast events.

---

# 23. Implementation Phases

The development agent must not attempt to build every module as a disconnected prototype. Implement the shared foundation and then complete end-to-end workflows.

## Phase 1 — Foundation and Unified Access

- React TypeScript project setup.
- Django project and DRF setup.
- PostgreSQL models and migrations.
- Organization / branch foundation.
- Unified login, logout, password reset.
- User and employee identity link.
- Roles, permissions, data scopes.
- Shared responsive layout, top header, dynamic sidebar.
- Route guards and API permission checks.
- Audit log foundation.
- Basic notifications.

**Acceptance:** One login works for all test roles. Each role sees only permitted menu items. Direct API and URL access are denied when unauthorized.

## Phase 2 — HRMS Core

- Employee directory and profiles.
- Department, designation, branch, manager.
- Shifts and weekly offs.
- Camera-assisted check-in/check-out.
- Live attendance, register, calendar.
- Attendance corrections.
- Leave applications and approvals.
- Holiday calendar and table with Add/Edit/Archive.
- Employee self-service dashboard.

**Acceptance:** An employee checks in and HR/Manager screens update. Leave and holiday changes update authorized calendars and notifications. Employee sees only own records.

## Phase 3 — Payroll

- Salary components and templates.
- Employee salary assignment and revision approval.
- Payroll period management.
- Attendance/leave/holiday/weekly-off integration.
- Payroll preview and exception handling.
- Maker-checker approval.
- Finalization and payslip PDF.
- Employee payslip self-service.

**Acceptance:** Payroll calculation can be explained employee by employee. Paid holiday and weekly off are not automatically deducted as absence. Finalized payroll is locked and auditable.

## Phase 4 — CRM & Sales

- Leads and assignment.
- Customer/contact directory.
- Opportunities and Kanban pipeline.
- Activities and follow-ups.
- CRM tasks.
- Lead-to-customer conversion.
- CRM dashboard and reports.

**Acceptance:** Lead conversion retains history, assigned users get real-time updates, and users cannot see leads outside their data scope.

## Phase 5 — Billing & Finance

- Product/service master.
- Quotations.
- Invoices and approvals.
- Payments and allocations.
- Receipts and customer ledger.
- Expenses and approvals.
- Tax settings and reports.
- CRM-to-billing links.

**Acceptance:** An accepted quotation can become an invoice; verified payments update invoice balances, receipts, customer ledger, and permitted dashboards.

## Phase 6 — Supporting ERP

- Inventory and purchase.
- Projects and tasks.
- Documents.
- Announcements and notifications.
- Helpdesk.
- Custom reports.

**Acceptance:** Stock movements are traceable, project tasks are permission-aware, documents are protected, and notifications reach only authorized users.

## Phase 7 — Administration, Hardening, and Deployment

- Approval workflow builder.
- Integration settings.
- Security settings and 2FA.
- Import/export.
- Backup/system health.
- Load and permission testing.
- Accessibility and mobile testing.
- Production deployment and monitoring.

**Acceptance:** Security, permissions, workflows, backup/restore, and production monitoring are tested and documented.

---

# 24. Mandatory End-to-End Test Scenarios

Create seed users and test roles in a development environment only. Clearly label test data.

## Scenario A — One Login, Multiple Roles
1. Create a Super Admin, HR, Manager, Employee, Accounts, and Sales user.
2. Log in through the same `/login` route.
3. Verify each user receives the same application shell with different menu entries.
4. Attempt to open an unauthorized route directly.
5. Attempt to call an unauthorized API directly.
6. Verify HTTP 403 and no data leakage.
7. Revoke a permission while a user is logged in and verify the sidebar, route, API, and WebSocket access update.

## Scenario B — Employee Attendance
1. Employee opens Check In.
2. Grants camera permission and submits a capture if required.
3. Backend accepts and stores the event.
4. Employee sees server-confirmed time.
5. HR Live Attendance updates.
6. Manager sees the updated team count if assigned to that employee.
7. Employee checks out and the work duration recalculates.
8. Duplicate check-in/check-out attempts are safely rejected or routed to correction.

## Scenario C — Leave and Holiday
1. HR adds a holiday using Add Holiday.
2. Holiday appears in the calendar and table.
3. Employee submits leave crossing that date.
4. System calculates applicable working days according to leave policy.
5. Manager approves; HR/Employee calendars update.
6. Employee's leave balance updates correctly.
7. Holiday edits are audited and do not silently rewrite finalized payroll.

## Scenario D — Salary and Payroll
1. HR creates a salary assignment for an employee.
2. A separate authorized reviewer approves the salary assignment.
3. Employee can view own approved salary only if permitted.
4. Manager cannot view salary by default.
5. HR starts payroll for an open period.
6. Preview displays working days, paid leave, LOP, holiday, weekly-off, earnings, and deductions.
7. A paid holiday or weekly off is not treated as unpaid absence by default.
8. Authorized reviewer approves; payroll operator finalizes.
9. Employee sees only their released payslip.
10. Finalized payroll cannot be edited without a controlled, audited process.

## Scenario E — CRM to Billing
1. Sales creates a lead.
2. Sales assigns a follow-up.
3. Lead converts to a customer and opportunity.
4. Sales creates quotation from the opportunity.
5. Customer accepts quotation.
6. Authorized Accounts user creates/issues invoice from accepted quotation.
7. Accounts records a partial payment and then final payment.
8. Invoice balance, receipt, customer ledger, and finance dashboard update.
9. Sales sees allowed status information but not restricted bank details or cost fields.

## Scenario F — Expense Approval
1. Employee submits expense with receipt.
2. Manager approves within permitted scope.
3. Accounts reviews and records payment.
4. Employee sees status update.
5. Audit history records each action.

## Scenario G — Inventory Purchase
1. Employee requests purchase.
2. Manager approves request.
3. Purchase team creates purchase order.
4. Goods are received through GRN.
5. Accepted quantity updates stock.
6. Vendor bill and payment are linked.
7. Stock and payable reports update.

## Scenario H — Permissions and Sensitive Data
1. Give HR employee-view permission but remove salary-view permission.
2. Confirm HR can view permitted employee details but cannot view salary fields, salary API, payslip of another employee, or salary exports.
3. Give Employee own salary/payslip permission only.
4. Confirm Employee cannot access another employee's salary by changing an ID.
5. Give Manager team attendance permission but no salary permission.
6. Confirm Manager can view team attendance and leave status but not salary or bank details.
7. Confirm Sub-Admin cannot grant permissions beyond delegated authority.

---

# 25. Definition of Done

The ERP is not complete merely because the sidebar and screens look attractive. The platform is ready for release only when all applicable checks below pass:

- [ ] One shared login page supports all user roles.
- [ ] One shared application shell and dynamic sidebar are implemented.
- [ ] Sidebar items are generated from active permissions and enabled modules.
- [ ] Every protected API enforces server-side permissions and data scope.
- [ ] Field-level sensitive permissions work for salary, bank, identity, and financial data.
- [ ] Direct URL/API access cannot bypass permissions.
- [ ] Employee self-service is restricted to the employee's own permitted records.
- [ ] HR and Manager screens show only their permitted organization/team data.
- [ ] Camera attendance works on supported HTTPS devices and has a controlled fallback.
- [ ] Attendance events use server timestamps and preserve correction history.
- [ ] Holiday page has both calendar and table views.
- [ ] Holiday page has working Add, View, Edit, Archive/Delete actions and filters.
- [ ] Weekly offs and paid holidays are not treated as unpaid absence by default.
- [ ] Leave approvals, balances, and calendars are connected.
- [ ] Salary assignments are effective-dated and approval-controlled.
- [ ] Payroll shows exact salary deductions and the reason/formula for each deduction.
- [ ] Payroll maker-checker and finalization locks work.
- [ ] Employee can view their own released payslip only when permitted.
- [ ] CRM lead-to-customer-to-opportunity workflow works.
- [ ] Quotation-to-invoice workflow works without duplicate records.
- [ ] Payments update invoices and customer balances only after verification.
- [ ] Inventory/purchase workflows are connected if those modules are enabled.
- [ ] Real-time events update only authorized screens and users.
- [ ] Notification delivery status is truthful and provider-aware.
- [ ] Audit history exists for high-risk and financial actions.
- [ ] Mobile, tablet, and desktop layouts are usable.
- [ ] All buttons, forms, filters, tables, exports, and reports are functional.
- [ ] Automated tests cover permissions, payroll, attendance, approvals, and billing calculations.
- [ ] No hardcoded credentials, fake production data, dead routes, or fake success messages exist.
- [ ] Setup, environment variables, migrations, deployment, backups, and restore instructions are documented.

---

# 26. Final Instruction to the Development Agent

Build this ERP as a connected, production-oriented business operating system. Use the sidebar and screen structure in this guide as the navigation and user-experience blueprint. Use the primary `Greenbacks_ERP_Full_Build_Prompt.md` as the broader technical and functional specification.

Prioritize correctness, security, usability, and connected workflows over visual decoration. The same data must flow through HRMS, CRM, Billing, Finance, Inventory, Projects, and Reports without unnecessary duplication. One login and one shared ERP shell must serve every authorized user. Permissions must determine what each user can see and do on every page, button, API, report, export, and real-time channel.

Do not mark a feature complete until its frontend, backend, database, permissions, validations, error states, audit trail, and relevant real-time updates are all implemented and tested.
