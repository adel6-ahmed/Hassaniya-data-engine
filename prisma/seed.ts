// prisma/seed.ts
// Initial seed data for the Hassaniya Dataset Platform

import { PrismaClient, UserRole, Domain, Intent, Region, SpeakerRole, DialogueStage } from '@prisma/client'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // ── Admin user ──────────────────────────────────────────────
  const adminPassword = 'HassaniyaAdmin!2026'
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hassaniya-dataset.com' },
    update: {
      name: 'Admin',
      role: UserRole.ADMIN,
      region: Region.NOUAKCHOTT,
      isActive: true,
      isApproved: true,
      approvalStatus: 'APPROVED',
      passwordHash: adminPasswordHash,
    },
    create: {
      name: 'Admin',
      email: 'admin@hassaniya-dataset.com',
      role: UserRole.ADMIN,
      region: Region.NOUAKCHOTT,
      isActive: true,
      isApproved: true,
      approvalStatus: 'APPROVED',
      passwordHash: adminPasswordHash,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // ── Reviewer user ────────────────────────────────────────────
  const reviewerPasswordHash = await bcrypt.hash('HassaniyaReviewer!2026', 12)
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@hassaniya-dataset.com' },
    update: {
      role: UserRole.REVIEWER,
      region: Region.NOUADHIBOU,
      isActive: true,
      isApproved: false,
      approvalStatus: 'PENDING',
      passwordHash: reviewerPasswordHash,
    },
    create: {
      name: 'Reviewer',
      email: 'reviewer@hassaniya-dataset.com',
      role: UserRole.REVIEWER,
      region: Region.NOUADHIBOU,
      isActive: true,
      isApproved: false,
      approvalStatus: 'PENDING',
      passwordHash: reviewerPasswordHash,
    },
  })
  console.log('✅ Reviewer user created:', reviewer.email)

  // ── Demo contributor ─────────────────────────────────────────
  const contributorPasswordHash = await bcrypt.hash('HassaniyaContributor!2026', 12)
  const contributor = await prisma.user.upsert({
    where: { email: 'contributor@hassaniya-dataset.com' },
    update: {
      role: UserRole.CONTRIBUTOR,
      region: Region.KIFFA,
      isActive: true,
      isApproved: true,
      approvalStatus: 'APPROVED',
      passwordHash: contributorPasswordHash,
    },
    create: {
      name: 'Contributor Demo',
      email: 'contributor@hassaniya-dataset.com',
      role: UserRole.CONTRIBUTOR,
      region: Region.KIFFA,
      isActive: true,
      isApproved: true,
      approvalStatus: 'APPROVED',
      passwordHash: contributorPasswordHash,
    },
  })
  console.log('✅ Contributor user created:', contributor.email)

  // ── Variation group example ──────────────────────────────────
  const greetingGroup = await prisma.variationGroup.create({
    data: {
      meaningArabic: 'كيف حالك',
      meaningFrench: 'Comment vas-tu',
      domain: Domain.GENERAL,
      intent: Intent.GREETING,
      createdById: contributor.id,
    },
  })
  console.log('✅ Variation group created')

  // ── Parallel sentences ───────────────────────────────────────
  const sentences = [
    { hassaniya: 'شماسي', msa: 'كيف حالك', fr: 'Comment vas-tu' },
    { hassaniya: 'اشحالك', msa: 'كيف حالك', fr: 'Comment tu vas' },
    { hassaniya: 'اشطاري', msa: 'كيف أنت', fr: 'Comment ça va' },
    { hassaniya: 'لاباس عليك', msa: 'هل أنت بخير', fr: 'Ça va bien ?' },
  ]

  for (const s of sentences) {
    await prisma.parallelSentence.create({
      data: {
        hassaniyaSentence: s.hassaniya,
        msaTranslation: s.msa,
        frenchTranslation: s.fr,
        rawText: s.hassaniya,
        normalizedText: s.hassaniya.trim().replace(/\s+/g, ' '),
        domain: Domain.GENERAL,
        intent: Intent.GREETING,
        region: Region.NOUAKCHOTT,
        confidenceLevel: 5,
        verifiedByNativeSpeaker: true,
        contributorId: contributor.id,
        variationGroupId: greetingGroup.id,
      },
    })
  }
  console.log('✅ Sample parallel sentences created')

  // ── Sample proverb ───────────────────────────────────────────
  await prisma.proverb.create({
    data: {
      proverbText: 'الگبل مگبل والبعد مبعد',
      meaningExplanation: 'القريب قريب والبعيد بعيد، أي أن الأهل والأقارب دائماً حاضرون',
      literalTranslation: 'القريب مقرّب والبعيد مُبعَد',
      rawText: 'الگبل مگبل والبعد مبعد',
      normalizedText: 'الگبل مگبل والبعد مبعد',
      domain: Domain.GENERAL,
      region: Region.NOUAKCHOTT,
      confidenceLevel: 5,
      verifiedByNativeSpeaker: true,
      contributorId: contributor.id,
    },
  })
  console.log('✅ Sample proverb created')

  // ── Sample dialogue ──────────────────────────────────────────
  const dialogueTitle = 'محادثة ترحيب بسيطة'
  const dialogueHash = crypto.createHash('sha256').update(dialogueTitle).digest('hex')
  
  const dialogue = await prisma.dialogue.create({
    data: {
      dialogueHash,
      title: dialogueTitle,
      topic: 'greeting',
      domain: Domain.GENERAL,
      region: Region.NOUAKCHOTT,
      turnCount: 4,
      isExportReady: true,
    },
  })

  const turns = [
    { index: 0, role: 'CUSTOMER' as const, text: 'شماسي', stage: 'OPENING' as const },
    { index: 1, role: 'ASSISTANT' as const, text: 'الحمد لله لاباس', stage: 'OPENING' as const },
    { index: 2, role: 'CUSTOMER' as const, text: 'منين ماشي', stage: 'CLARIFICATION' as const },
    { index: 3, role: 'ASSISTANT' as const, text: 'گايس السوق', stage: 'RESOLUTION' as const },
  ]

  for (const t of turns) {
    const textHash = crypto.createHash('sha256').update(t.text.trim()).digest('hex')
    await prisma.dialogueTurn.create({
      data: {
        dialogueId: dialogue.id,
        turnIndex: t.index,
        utteranceText: t.text,
        rawText: t.text,
        normalizedText: t.text.trim(),
        textHash,
        speakerRole: t.role as SpeakerRole,
        dialogueStage: t.stage as DialogueStage,
        domain: Domain.GENERAL,
        intent: Intent.GREETING,
        region: Region.NOUAKCHOTT,
        contributorId: contributor.id,
      },
    })
  }
  console.log('✅ Sample dialogue created')

  // ── Sample FAQ ───────────────────────────────────────────────
  await prisma.faqEntry.create({
    data: {
      questionHassaniya: 'منين نقدر نخلص الفاتورة',
      questionMsa: 'أين يمكنني دفع الفاتورة',
      answerHassaniya: 'تقدر تخلصها من التطبيق أو من الفرع أو من الوكيل المعتمد',
      answerMsa: 'يمكنك الدفع عبر التطبيق أو الفرع أو الوكيل المعتمد',
      answerFrench: 'Vous pouvez payer via l\'application, une agence ou un agent agréé',
      rawQuestion: 'منين نقدر نخلص الفاتورة',
      normalizedQuestion: 'منين نقدر نخلص الفاتورة',
      domain: Domain.TELECOM,
      intent: Intent.BILLING_ISSUE,
      isActive: true,
      contributorId: contributor.id,
    },
  })
  console.log('✅ Sample FAQ created')

  // ── Weekly task example ──────────────────────────────────────
  await prisma.contributorTask.create({
    data: {
      title: 'أضف 20 جملة ترحيب',
      description: 'جمع جمل الترحيب والتحية الشائعة في اللهجة الحسانية',
      instructions: 'اكتب جمل التحية المستخدمة يومياً في منطقتك، مع ترجمتها للعربية الفصحى. تأكد من التنوع في الأساليب والمناطق.',
      moduleTarget: 'parallel_sentences',
      domain: Domain.GENERAL,
      intent: Intent.GREETING,
      targetCount: 20,
      status: 'ACTIVE',
      createdById: admin.id,
    },
  })
  console.log('✅ Sample contributor task created')

  // ── Initial platform stats ───────────────────────────────────
  await prisma.platformStats.create({
    data: {
      totalSentences: sentences.length,
      totalTexts: 0,
      totalProverbs: 1,
      totalDialogues: 1,
      totalFaqEntries: 1,
    },
  })
  console.log('✅ Platform stats initialized')

  console.log('\n🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
