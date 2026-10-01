import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ApexCRM database...');

  const seedPassword = process.env.SEED_DEFAULT_PASSWORD || 'password123';
  const defaultPasswordHash = await bcrypt.hash(seedPassword, 10);

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'sarah.chen@apexcrm.io' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: 'Sarah Chen',
      email: 'sarah.chen@apexcrm.io',
      passwordHash: defaultPasswordHash,
      role: 'admin',
    },
  });

  const repUser = await prisma.user.upsert({
    where: { email: 'marcus.johnson@apexcrm.io' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: 'Marcus Johnson',
      email: 'marcus.johnson@apexcrm.io',
      passwordHash: defaultPasswordHash,
      role: 'rep',
    },
  });

  const rep2User = await prisma.user.upsert({
    where: { email: 'priya.patel@apexcrm.io' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: 'Priya Patel',
      email: 'priya.patel@apexcrm.io',
      passwordHash: defaultPasswordHash,
      role: 'rep',
    },
  });

  console.log('✅ Users created');

  // ─── Companies ────────────────────────────────────────────────────────────
  const acmeCorp = await prisma.company.upsert({
    where: { domain: 'acmecorp.com' },
    update: {},
    create: {
      name: 'Acme Corporation',
      domain: 'acmecorp.com',
      industry: 'Manufacturing',
      size: 'enterprise',
    },
  });

  const zenithTech = await prisma.company.upsert({
    where: { domain: 'zenithtech.io' },
    update: {},
    create: {
      name: 'Zenith Technologies',
      domain: 'zenithtech.io',
      industry: 'Software',
      size: 'mid-market',
    },
  });

  const novaHealth = await prisma.company.upsert({
    where: { domain: 'novahealth.com' },
    update: {},
    create: {
      name: 'Nova Health Systems',
      domain: 'novahealth.com',
      industry: 'Healthcare',
      size: 'enterprise',
    },
  });

  const peakStartup = await prisma.company.upsert({
    where: { domain: 'peakventures.co' },
    update: {},
    create: {
      name: 'Peak Ventures',
      domain: 'peakventures.co',
      industry: 'Finance',
      size: 'startup',
    },
  });

  console.log('✅ Companies created');

  // ─── Contacts ─────────────────────────────────────────────────────────────
  const contact1 = await prisma.contact.upsert({
    where: { email: 'james.wright@acmecorp.com' },
    update: { userId: adminUser.id },
    create: {
      companyId: acmeCorp.id,
      userId: adminUser.id,
      firstName: 'James',
      lastName: 'Wright',
      email: 'james.wright@acmecorp.com',
      phone: '+1-555-0101',
      title: 'VP of Operations',
      status: 'active',
      intentScore: 87,
    },
  });

  const contact2 = await prisma.contact.upsert({
    where: { email: 'linda.torres@acmecorp.com' },
    update: { userId: adminUser.id },
    create: {
      companyId: acmeCorp.id,
      userId: adminUser.id,
      firstName: 'Linda',
      lastName: 'Torres',
      email: 'linda.torres@acmecorp.com',
      phone: '+1-555-0102',
      title: 'CTO',
      status: 'active',
      intentScore: 72,
    },
  });

  const contact3 = await prisma.contact.upsert({
    where: { email: 'alex.kim@zenithtech.io' },
    update: { userId: repUser.id },
    create: {
      companyId: zenithTech.id,
      userId: repUser.id,
      firstName: 'Alex',
      lastName: 'Kim',
      email: 'alex.kim@zenithtech.io',
      phone: '+1-555-0201',
      title: 'Head of Engineering',
      status: 'active',
      intentScore: 91,
    },
  });

  const contact4 = await prisma.contact.upsert({
    where: { email: 'rachel.nguyen@zenithtech.io' },
    update: { userId: repUser.id },
    create: {
      companyId: zenithTech.id,
      userId: repUser.id,
      firstName: 'Rachel',
      lastName: 'Nguyen',
      email: 'rachel.nguyen@zenithtech.io',
      phone: '+1-555-0202',
      title: 'CEO',
      status: 'prospect',
      intentScore: 60,
    },
  });

  const contact5 = await prisma.contact.upsert({
    where: { email: 'dr.evan.brooks@novahealth.com' },
    update: { userId: rep2User.id },
    create: {
      companyId: novaHealth.id,
      userId: rep2User.id,
      firstName: 'Evan',
      lastName: 'Brooks',
      email: 'dr.evan.brooks@novahealth.com',
      phone: '+1-555-0301',
      title: 'Chief Medical Officer',
      status: 'active',
      intentScore: 78,
    },
  });

  const contact6 = await prisma.contact.upsert({
    where: { email: 'maria.santos@novahealth.com' },
    update: { userId: rep2User.id },
    create: {
      companyId: novaHealth.id,
      userId: rep2User.id,
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria.santos@novahealth.com',
      phone: '+1-555-0302',
      title: 'Director of IT',
      status: 'active',
      intentScore: 83,
    },
  });

  const contact7 = await prisma.contact.upsert({
    where: { email: 'tyler.mason@peakventures.co' },
    update: { userId: repUser.id },
    create: {
      companyId: peakStartup.id,
      userId: repUser.id,
      firstName: 'Tyler',
      lastName: 'Mason',
      email: 'tyler.mason@peakventures.co',
      phone: '+1-555-0401',
      title: 'Founder & CEO',
      status: 'prospect',
      intentScore: 45,
    },
  });

  const contact8 = await prisma.contact.upsert({
    where: { email: 'nina.ford@peakventures.co' },
    update: { userId: repUser.id },
    create: {
      companyId: peakStartup.id,
      userId: repUser.id,
      firstName: 'Nina',
      lastName: 'Ford',
      email: 'nina.ford@peakventures.co',
      phone: '+1-555-0402',
      title: 'Head of Finance',
      status: 'prospect',
      intentScore: 38,
    },
  });

  console.log('✅ Contacts created');

  // ─── Deals ────────────────────────────────────────────────────────────────
  const deal1 = await prisma.deal.upsert({
    where: { id: 'deal-acme-platform' },
    update: { userId: adminUser.id },
    create: {
      id: 'deal-acme-platform',
      contactId: contact1.id,
      userId: adminUser.id,
      title: 'Acme Enterprise Platform License',
      value: 185000,
      stage: 'negotiation',
      probability: 80,
      expectedCloseDate: new Date('2026-10-31'),
    },
  });

  const deal2 = await prisma.deal.upsert({
    where: { id: 'deal-acme-support' },
    update: { userId: adminUser.id },
    create: {
      id: 'deal-acme-support',
      contactId: contact2.id,
      userId: adminUser.id,
      title: 'Acme Premium Support Package',
      value: 42000,
      stage: 'proposal',
      probability: 60,
      expectedCloseDate: new Date('2026-11-15'),
    },
  });

  const deal3 = await prisma.deal.upsert({
    where: { id: 'deal-zenith-saas' },
    update: { userId: repUser.id },
    create: {
      id: 'deal-zenith-saas',
      contactId: contact3.id,
      userId: repUser.id,
      title: 'Zenith SaaS Integration Suite',
      value: 95000,
      stage: 'closed-won',
      probability: 100,
      expectedCloseDate: new Date('2026-09-15'),
    },
  });

  const deal4 = await prisma.deal.upsert({
    where: { id: 'deal-zenith-expansion' },
    update: { userId: repUser.id },
    create: {
      id: 'deal-zenith-expansion',
      contactId: contact4.id,
      userId: repUser.id,
      title: 'Zenith Team Expansion — Seats Upgrade',
      value: 28000,
      stage: 'discovery',
      probability: 30,
      expectedCloseDate: new Date('2026-12-01'),
    },
  });

  const deal5 = await prisma.deal.upsert({
    where: { id: 'deal-nova-ehr' },
    update: { userId: rep2User.id },
    create: {
      id: 'deal-nova-ehr',
      contactId: contact5.id,
      userId: rep2User.id,
      title: 'Nova EHR AI Analytics Module',
      value: 320000,
      stage: 'qualification',
      probability: 45,
      expectedCloseDate: new Date('2027-01-31'),
    },
  });

  const deal6 = await prisma.deal.upsert({
    where: { id: 'deal-nova-security' },
    update: { userId: rep2User.id },
    create: {
      id: 'deal-nova-security',
      contactId: contact6.id,
      userId: rep2User.id,
      title: 'Nova Security & Compliance Bundle',
      value: 67000,
      stage: 'proposal',
      probability: 65,
      expectedCloseDate: new Date('2026-11-30'),
    },
  });

  const deal7 = await prisma.deal.upsert({
    where: { id: 'deal-peak-starter' },
    update: { userId: repUser.id },
    create: {
      id: 'deal-peak-starter',
      contactId: contact7.id,
      userId: repUser.id,
      title: 'Peak Ventures Starter Plan',
      value: 12000,
      stage: 'discovery',
      probability: 20,
      expectedCloseDate: new Date('2026-12-15'),
    },
  });

  console.log('✅ Deals created');

  // ─── Timeline Events ───────────────────────────────────────────────────────
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  await prisma.timelineEvent.createMany({
    data: [
      // James Wright (contact1) / deal1 events
      {
        contactId: contact1.id,
        dealId: deal1.id,
        type: 'email_sent',
        metadata: JSON.stringify({ subject: 'Enterprise Platform Proposal', from: 'sarah.chen@apexcrm.io', to: 'james.wright@acmecorp.com', snippet: 'Hi James, following up on our discovery call...' }),
        createdAt: daysAgo(21),
      },
      {
        contactId: contact1.id,
        dealId: deal1.id,
        type: 'email_open',
        metadata: JSON.stringify({ subject: 'Enterprise Platform Proposal', opens: 3, lastOpenedAt: daysAgo(20).toISOString() }),
        createdAt: daysAgo(20),
      },
      {
        contactId: contact1.id,
        dealId: deal1.id,
        type: 'call',
        metadata: JSON.stringify({ duration: 2700, outcome: 'positive', notes: 'James confirmed budget approval. Moving to negotiation.', rep: 'Sarah Chen' }),
        createdAt: daysAgo(14),
      },
      {
        contactId: contact1.id,
        dealId: deal1.id,
        type: 'deal_stage_change',
        metadata: JSON.stringify({ from: 'proposal', to: 'negotiation', changedBy: 'sarah.chen@apexcrm.io' }),
        createdAt: daysAgo(14),
      },
      {
        contactId: contact1.id,
        dealId: deal1.id,
        type: 'meeting',
        metadata: JSON.stringify({ title: 'Contract Review Meeting', attendees: ['James Wright', 'Sarah Chen', 'Legal Team'], outcome: 'Minor redlines on SLA terms' }),
        createdAt: daysAgo(7),
      },
      {
        contactId: contact1.id,
        dealId: deal1.id,
        type: 'email_sent',
        metadata: JSON.stringify({ subject: 'Revised Contract — Acme Enterprise', from: 'sarah.chen@apexcrm.io', to: 'james.wright@acmecorp.com', snippet: 'Please find the revised terms attached...' }),
        createdAt: daysAgo(5),
      },
      {
        contactId: contact1.id,
        dealId: deal1.id,
        type: 'email_open',
        metadata: JSON.stringify({ subject: 'Revised Contract — Acme Enterprise', opens: 5, lastOpenedAt: daysAgo(4).toISOString() }),
        createdAt: daysAgo(4),
      },

      // Alex Kim (contact3) / deal3 — closed won
      {
        contactId: contact3.id,
        dealId: deal3.id,
        type: 'email_sent',
        metadata: JSON.stringify({ subject: 'Welcome to Zenith Integration Suite!', from: 'marcus.johnson@apexcrm.io', to: 'alex.kim@zenithtech.io', snippet: 'Congratulations on closing the deal! Here are your onboarding steps...' }),
        createdAt: daysAgo(15),
      },
      {
        contactId: contact3.id,
        dealId: deal3.id,
        type: 'deal_stage_change',
        metadata: JSON.stringify({ from: 'negotiation', to: 'closed-won', changedBy: 'marcus.johnson@apexcrm.io' }),
        createdAt: daysAgo(15),
      },
      {
        contactId: contact3.id,
        type: 'meeting',
        metadata: JSON.stringify({ title: 'Kickoff & Onboarding Session', attendees: ['Alex Kim', 'Marcus Johnson', 'Onboarding Team'], outcome: 'Implementation timeline set for 6 weeks' }),
        createdAt: daysAgo(10),
      },

      // Evan Brooks (contact5) / deal5 — in qualification
      {
        contactId: contact5.id,
        dealId: deal5.id,
        type: 'call',
        metadata: JSON.stringify({ duration: 1800, outcome: 'exploratory', notes: 'Dr. Brooks interested in AI-driven diagnostics integration. Needs compliance review.', rep: 'Priya Patel' }),
        createdAt: daysAgo(10),
      },
      {
        contactId: contact5.id,
        dealId: deal5.id,
        type: 'email_sent',
        metadata: JSON.stringify({ subject: 'HIPAA Compliance Overview — Nova Health', from: 'priya.patel@apexcrm.io', to: 'dr.evan.brooks@novahealth.com', snippet: 'Attached is our HIPAA compliance documentation and SOC2 report...' }),
        createdAt: daysAgo(8),
      },
      {
        contactId: contact5.id,
        dealId: deal5.id,
        type: 'email_open',
        metadata: JSON.stringify({ subject: 'HIPAA Compliance Overview — Nova Health', opens: 2, lastOpenedAt: daysAgo(7).toISOString() }),
        createdAt: daysAgo(7),
      },

      // Maria Santos (contact6) / deal6 — proposal
      {
        contactId: contact6.id,
        dealId: deal6.id,
        type: 'demo',
        metadata: JSON.stringify({ title: 'Security & Compliance Demo', attendees: ['Maria Santos', 'IT Team x3', 'Priya Patel'], duration: 3600, outcome: 'Positive. Team requested pricing breakdown.' }),
        createdAt: daysAgo(12),
      },
      {
        contactId: contact6.id,
        dealId: deal6.id,
        type: 'email_sent',
        metadata: JSON.stringify({ subject: 'ApexCRM Security Bundle — Pricing Proposal', from: 'priya.patel@apexcrm.io', to: 'maria.santos@novahealth.com', snippet: 'As discussed, here is the full pricing breakdown for the Security & Compliance Bundle...' }),
        createdAt: daysAgo(9),
      },
      {
        contactId: contact6.id,
        dealId: deal6.id,
        type: 'email_open',
        metadata: JSON.stringify({ subject: 'ApexCRM Security Bundle — Pricing Proposal', opens: 4, lastOpenedAt: daysAgo(8).toISOString() }),
        createdAt: daysAgo(8),
      },

      // Tyler Mason (contact7) / deal7 — early discovery
      {
        contactId: contact7.id,
        dealId: deal7.id,
        type: 'email_sent',
        metadata: JSON.stringify({ subject: 'ApexCRM for Fast-Growing Startups', from: 'marcus.johnson@apexcrm.io', to: 'tyler.mason@peakventures.co', snippet: 'Hi Tyler, I noticed Peak Ventures is in an exciting growth phase...' }),
        createdAt: daysAgo(5),
      },
      {
        contactId: contact7.id,
        dealId: deal7.id,
        type: 'email_open',
        metadata: JSON.stringify({ subject: 'ApexCRM for Fast-Growing Startups', opens: 1, lastOpenedAt: daysAgo(4).toISOString() }),
        createdAt: daysAgo(4),
      },
    ],
  });

  console.log('✅ Timeline events created');

  // ─── Notes ────────────────────────────────────────────────────────────────
  await prisma.note.createMany({
    data: [
      {
        contactId: contact1.id,
        authorId: adminUser.id,
        rawContent: 'Spoke with James today. He confirmed the board approved the $185k budget for the platform license. Main concern is data migration timeline — wants everything live by Q1 2027. Legal flagged 2 SLA clauses for revision. Need to loop in our legal team before end of week.',
        summary: 'Budget confirmed at $185k. Key concern: data migration timeline (Q1 2027 target). Legal review needed on 2 SLA clauses.',
        actionItems: JSON.stringify(['Loop in legal team re: SLA clauses by Friday', 'Send revised contract draft', 'Schedule migration scoping call']),
        createdAt: daysAgo(7),
      },
      {
        contactId: contact3.id,
        authorId: repUser.id,
        rawContent: 'Kickoff call with Alex went really well. Onboarding team is in place. They have 4 engineers ready to start integration. Alex mentioned they may need additional API call capacity in month 2 — flagged this as potential upsell opportunity. Follow up in 30 days.',
        summary: 'Kickoff successful. 4 engineers assigned for integration. Potential upsell on API capacity in ~30 days.',
        actionItems: JSON.stringify(['Set 30-day upsell reminder for API capacity', 'Share integration documentation with Alex\'s team', 'Schedule 2-week check-in call']),
        createdAt: daysAgo(10),
      },
      {
        contactId: contact5.id,
        authorId: rep2User.id,
        rawContent: 'Initial call with Dr. Brooks. Very interested in the AI diagnostics module. Primary blocker is HIPAA compliance review — their legal team needs 3-4 weeks to review our BAA. Also mentioned they are evaluating 2 other vendors. We need to accelerate. Sent compliance docs. Need to get a technical demo scheduled ASAP.',
        summary: 'Strong interest in AI module. 3-4 week compliance review is the blocker. 2 competitors in evaluation. Need fast demo.',
        actionItems: JSON.stringify(['Schedule technical demo within 2 weeks', 'Follow up with HIPAA BAA tracking', 'Research competitor weaknesses']),
        createdAt: daysAgo(8),
      },
      {
        contactId: contact6.id,
        authorId: rep2User.id,
        rawContent: 'Great demo session with Maria and her IT team. They love the security dashboard and real-time threat monitoring. Price was higher than expected — Maria said she needs to get sign-off from CFO. Suggested we offer a 10% discount for Q4 close. Will follow up Monday.',
        summary: 'Demo well received. CFO approval needed. Consider 10% Q4 discount to accelerate close.',
        actionItems: JSON.stringify(['Prepare discount approval request for manager', 'Follow up with Maria on Monday', 'Send CFO-friendly ROI one-pager']),
        createdAt: daysAgo(9),
      },
    ],
  });

  console.log('✅ Notes created');
  console.log('\n🎉 Database seeded successfully!');
  console.log(`   📊 ${3} users, ${4} companies, ${8} contacts, ${7} deals`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
