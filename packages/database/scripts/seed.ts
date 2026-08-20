import { desc, eq } from "drizzle-orm";
import { getAtlasDb, schema } from "../src/index";

const seed = async () => {
  const db = getAtlasDb();

  const [contact] = await db
    .insert(schema.crmContacts)
    .values({
      fullName: "María López Demo",
      email: "maria@ejemplo.com",
      phone: "+12025550100",
      preferredLanguage: "en",
    })
    .onConflictDoNothing({ target: schema.crmContacts.email })
    .returning();

  const [client] = await db
    .insert(schema.crmClients)
    .values({
      name: "Acme LLC",
      email: "client@acme.com",
      services: "Credit, Taxes",
      caseStatus: "under review",
      note: "Cliente de prueba para módulo admin",
    })
    .onConflictDoNothing({ target: schema.crmClients.email })
    .returning();

  const [company] = await db
    .insert(schema.crmCompanies)
    .values({
      name: "Acme LLC",
      type: "LLC",
      ein: "12-3456789",
      state: "DE",
      status: "active",
      industry: "Services",
      formed: "2026-01-10",
    })
    .onConflictDoNothing({ target: schema.crmCompanies.ein })
    .returning();

  if (contact?.id) {
    const [existingLead] = await db
      .select({ id: schema.crmLeads.id })
      .from(schema.crmLeads)
      .where(eq(schema.crmLeads.contactId, contact.id))
      .limit(1);

    if (!existingLead) {
      const [lead] = await db
        .insert(schema.crmLeads)
        .values({
          contactId: contact.id,
          source: "web",
          serviceInterest: "Credit",
          status: "new",
          stage: "new",
          notes: "Lead seed",
        })
        .returning();
      if (lead) {
        await db.insert(schema.crmLeadNotes).values({
          leadId: lead.id,
          actor: "System",
          content: "Seed note from local setup",
        });
      }
    }
  }

  if (client?.id) {
    const [existingManagementLead] = await db
      .select({ id: schema.crmLeadManagement.id })
      .from(schema.crmLeadManagement)
      .where(eq(schema.crmLeadManagement.name, "Carlos Demo"))
      .limit(1);

    if (!existingManagementLead) {
      await db.insert(schema.crmLeadManagement).values({
        name: "Carlos Demo",
        service: "Credit",
        source: "chat",
        status: "new",
        score: 78,
        converted: 0,
        summary: "Seed lead management",
      });
    }

    const [existingOrder] = await db
      .select({ id: schema.crmServiceOrders.id })
      .from(schema.crmServiceOrders)
      .where(eq(schema.crmServiceOrders.clientId, client.id))
      .orderBy(desc(schema.crmServiceOrders.createdAt))
      .limit(1);

    if (!existingOrder) {
      await db.insert(schema.crmServiceOrders).values({
        clientId: client.id,
        client: client.name,
        service: "Business credit",
        price: 5000,
        discount: 0,
        status: "approval_pending",
        owner: "Operations team",
        paid: 0,
      });
    }
  }

  if (!company) {
    console.log("Company already existed with same EIN.");
  }
};

seed()
  .then(() => {
    console.log("Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  });
