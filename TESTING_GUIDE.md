# Dialogue API Testing Guide

## Status: Dev Server Running ✅

Your dev server is running successfully at `http://localhost:3000`, but Supabase database connectivity is unavailable in this environment. The validation layer is fully functional and has been tested.

---

## Part 1: Schema Validation Tests ✅ PASSING

All Zod schema validation tests pass (8/8):

```
✅ Test 1: Reject < 2 turns
✅ Test 2: Reject non-sequential turnIndex [0, 2]
✅ Test 3: Reject duplicate turnIndex [0, 0]
✅ Test 4: Accept out-of-order but valid indices [1, 0]
✅ Test 5: Accept minimal valid dialogue [0, 1]
✅ Test 6: Accept 3+ turns [0, 1, 2]
✅ Test 7: Speaker role "user" validation
✅ Test 8: Reject invalid speaker role "invalid"
```

**Run tests anytime with:**
```bash
node test-dialogue-validation.mjs
```

---

## Part 2: Full Integration Tests (When Database Connected)

Once Supabase DNS connectivity is restored, you can test the full dialogue API including:
- Turn-level deduplication
- Dialogue-level exact duplicate detection
- Text normalization (via edge function)
- Database storage and retrieval

### Test Locally via cURL

With database connected, test the API directly:

```bash
# Test 1: Valid dialogue (expect 201)
curl -X POST http://localhost:3000/api/dialogues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Test Dialogue",
    "domain": "GENERAL",
    "region": "OTHER",
    "turns": [
      {
        "turnIndex": 0,
        "utteranceText": "مرحبا",
        "speakerRole": "user",
        "dialogueStage": "OPENING",
        "intent": "GREETING",
        "domain": "GENERAL",
        "region": "OTHER",
        "emotionalTone": "NEUTRAL",
        "confidenceLevel": 3,
        "verifiedByNativeSpeaker": false
      },
      {
        "turnIndex": 1,
        "utteranceText": "مرحبا بك",
        "speakerRole": "assistant",
        "dialogueStage": "OPENING",
        "intent": "GREETING",
        "domain": "GENERAL",
        "region": "OTHER",
        "emotionalTone": "POSITIVE",
        "confidenceLevel": 3,
        "verifiedByNativeSpeaker": false
      }
    ]
  }'

# Expected response: 201 with dialogue object including dialogueHash and turns
```

```bash
# Test 2: Duplicate turn in same request (expect 409)
curl -X POST http://localhost:3000/api/dialogues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Duplicate Turn Test",
    "domain": "GENERAL",
    "region": "OTHER",
    "turns": [
      {
        "turnIndex": 0,
        "utteranceText": "مرحبا بك في الخدمة",
        "speakerRole": "assistant",
        "dialogueStage": "OPENING",
        "intent": "GREETING",
        "domain": "GENERAL",
        "region": "OTHER",
        "emotionalTone": "POSITIVE",
        "confidenceLevel": 3,
        "verifiedByNativeSpeaker": false
      },
      {
        "turnIndex": 1,
        "utteranceText": "مرحبا بك في الخدمة",
        "speakerRole": "assistant",
        "dialogueStage": "RESOLUTION",
        "intent": "GREETING",
        "domain": "GENERAL",
        "region": "OTHER",
        "emotionalTone": "POSITIVE",
        "confidenceLevel": 3,
        "verifiedByNativeSpeaker": false
      }
    ]
  }'

# Expected response: 409 with error: "Turn text is duplicated in the same request"
```

### Test via Postman/Insomnia

1. Create new **POST** request
2. URL: `http://localhost:3000/api/dialogues`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer <your_token>`
4. Body: Copy any test case from `DIALOGUE_API_TEST_CASES.md`
5. Send and observe status + response

### Test via UI

Navigate to: `http://localhost:3000/dashboard/contribute/dialogues`

Fill in the dialogue form:
- **Speaker Role:** Dropdown with `user`, `assistant`, `system`
- **Turns:** At least 2 required
- Submit and observe validation feedback

---

## Part 3: Database Fixtures (When Connected)

Once database is available, run this SQL to create test fixtures:

```sql
-- Insert a test dialogue for dedup testing
INSERT INTO "Dialogue" (
  id, title, topic, domain, region, "turnCount", "dialogueHash", "contributorId", "createdAt", "updatedAt"
) VALUES (
  'test_dialogue_001',
  'Customer Service Test',
  NULL,
  'TELECOM',
  'NOUAKCHOTT',
  2,
  'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
  'test_contributor_001',
  NOW(),
  NOW()
);

INSERT INTO "DialogueTurn" (
  id, "dialogueId", "turnIndex", "utteranceText", "rawText", "normalizedText", "textHash",
  "speakerRole", "dialogueStage", intent, domain, topic, region, "emotionalTone",
  "confidenceLevel", "verifiedByNativeSpeaker", "variationGroupId", "contributorId",
  "createdAt", "updatedAt"
) VALUES
(
  'turn_001',
  'test_dialogue_001',
  0,
  'مرحبا، أنا أريد الاستفسار عن فاتورتي',
  'مرحبا، أنا أريد الاستفسار عن فاتورتي',
  'مرحبا أنا أريد الاستفسار عن فاتورتي',
  'hash_001',
  'user',
  'OPENING',
  'BILLING_ISSUE',
  'TELECOM',
  NULL,
  'NOUAKCHOTT',
  'NEUTRAL',
  4,
  true,
  NULL,
  'test_contributor_001',
  NOW(),
  NOW()
),
(
  'turn_002',
  'test_dialogue_001',
  1,
  'بكل سرور، ما هو رقم حسابك من فضلك؟',
  'بكل سرور، ما هو رقم حسابك من فضلك؟',
  'بكل سرور ما هو رقم حسابك من فضلك',
  'hash_002',
  'assistant',
  'CLARIFICATION',
  'BILLING_ISSUE',
  'TELECOM',
  NULL,
  'NOUAKCHOTT',
  'POSITIVE',
  4,
  true,
  NULL,
  'test_contributor_001',
  NOW(),
  NOW()
);
```

---

## Part 4: Debugging Checklist

When database connectivity is available and you test, use these checks:

### If validation passes but API returns error:

1. **Check authentication:**
   ```bash
   curl -v http://localhost:3000/api/dialogues \
     -H "Authorization: Bearer invalid_token"
   ```
   Should return 401 if no valid token

2. **Check database connection:**
   ```bash
   npm run dev  # Watch for "Can't reach database server" errors
   ```

3. **Check Prisma schema:**
   ```bash
   npx prisma validate  # Validates schema.prisma
   ```

4. **Check migrations:**
   ```bash
   npx prisma migrate status  # Shows pending migrations
   ```

### If validation fails:

- Review `DIALOGUE_API_TEST_CASES.md` for exact input format
- Check the error message from test output
- Ensure all required fields are present
- Verify enum values match exactly (case-sensitive)

---

## Part 5: Speaker Role Reference

The dialogue API supports these speaker roles (from schema):

```typescript
speakerRole: z.enum(['user', 'assistant', 'system'])
```

**Examples:**
- `"user"` - Human user input
- `"assistant"` - AI/chatbot response
- `"system"` - System message or context

All three are now properly validated in the schema. ✅

---

## Part 6: Next Steps

1. **Immediate:** Use `test-dialogue-validation.mjs` to verify schema validation offline
2. **When DB connected:** Run cURL tests from `DIALOGUE_API_TEST_CASES.md`
3. **Integration:** Test the full dialogue workflow via UI at `/dashboard/contribute/dialogues`
4. **Production:** Apply migration `008_fix5_dialogue_level_dedup_and_turn_unique.sql` with proper DB connection

---

## File Reference

- **Schema tests:** `/test-dialogue-validation.mjs` (8 passing tests)
- **Test cases:** `DIALOGUE_API_TEST_CASES.md` (comprehensive documentation)
- **API route:** `app/api/dialogues/route.ts` (implementation)
- **Validation schema:** `lib/validations.ts` (Zod schemas)
- **Database schema:** `prisma/schema.prisma`
- **Migration:** `prisma/migrations/008_fix5_dialogue_level_dedup_and_turn_unique.sql`

---

## Summary

✅ **Schema validation layer:** Fully tested and working  
✅ **Speaker roles:** user | assistant | system  
✅ **Validation rules:** Tested (min 2 turns, sequential turnIndex, etc.)  
⏳ **Database operations:** Waiting for DB connectivity  
⏳ **Full integration:** Ready to test when DB available  

The platform is ready for end-to-end testing once Supabase connectivity is restored.
