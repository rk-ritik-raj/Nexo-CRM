import axios from "axios";

const CRM_URL = "http://localhost:5000/api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log("=== STARTING CRM INTEGRATION TEST ===");

  try {
    // 1. Ingest Sample Data
    console.log("\n1. Seeding database with mock shoppers & orders...");
    const seedRes = await axios.post(`${CRM_URL}/customers/ingest-sample`);
    console.log(`Successfully seeded: ${seedRes.data.customersCount} customers, ${seedRes.data.ordersCount} orders.`);

    // 2. Validate Customer and Order lists
    const custRes = await axios.get(`${CRM_URL}/customers`);
    if (custRes.data.length !== 15) {
      throw new Error(`Seeding count mismatch. Expected 15 customers, got ${custRes.data.length}`);
    }
    console.log(`Verified customer ledger has ${custRes.data.length} shoppers.`);

    // 3. Create Segment (Delhi High Spenders)
    console.log("\n2. Creating a segment: Delhi VIPs (city = Delhi AND spend > 100)...");
    const segmentRes = await axios.post(`${CRM_URL}/segments`, {
      name: "Delhi VIPs",
      description: "Delhi customers with high spend values",
      rules: [
        { field: "city", operator: "eq", value: "Delhi" },
        { field: "totalSpend", operator: "gt", value: 100 },
      ],
    });
    const segment = segmentRes.data;
    console.log(`Created Segment: "${segment.name}" with ID: ${segment._id}, size computed as: ${segment.size}`);

    if (segment.size !== 2) {
      throw new Error(`Segment size mismatch. Expected 2 matching customers, got ${segment.size}`);
    }
    console.log("Segment size verification passed (matches Alice Smith and Lucas Chen).");

    // 4. Create Campaign
    console.log("\n3. Creating WhatsApp Campaign for Delhi VIPs...");
    const campaignRes = await axios.post(`${CRM_URL}/campaigns`, {
      name: "Delhi Shoes Campaign",
      description: "Promoting luxury leather shoes",
      segmentId: segment._id,
      channel: "whatsapp",
      messageTemplate: "Hi {name}, our new collection is out! You spent {totalSpend} with us. Enjoy 15% off shoes with code SHOES15.",
    });
    const campaign = campaignRes.data;
    console.log(`Created Campaign Draft: "${campaign.name}" with ID: ${campaign._id}, status: ${campaign.status}`);

    // 5. Send Campaign
    console.log("\n4. Launching Campaign (Asynchronous Send)...");
    const launchRes = await axios.post(`${CRM_URL}/campaigns/${campaign._id}/send`);
    console.log(`Launch response: ${launchRes.data.message}. Target count: ${launchRes.data.targetCount}`);

    // Wait a few seconds for the Channel Service simulator to receive sends and run its timers
    console.log("Waiting 4 seconds for Channel Service to execute asynchronous callbacks (Delivered -> Opened -> Read)...");
    await sleep(4000);

    // 6. Inspect logs and callbacks in database
    console.log("\n5. Checking dispatch logs...");
    const detailsRes = await axios.get(`${CRM_URL}/campaigns/${campaign._id}`);
    const logs = detailsRes.data.logs;
    console.log(`Dispatched communication logs found: ${logs.length}`);
    if (logs.length !== 2) {
      throw new Error(`Log length mismatch. Expected 2 sent logs, got ${logs.length}`);
    }

    const sampleLog = logs[0];
    console.log(`Sample Log Status: ${sampleLog.status}`);
    console.log(`Sample Log Text: "${sampleLog.messageText}"`);
    console.log(`Sample Log Tracking ID: ${sampleLog.trackingId}`);

    // 7. Simulate click callback
    console.log("\n6. Simulating shopper link-click callback...");
    const clickRes = await axios.post(`${CRM_URL}/callbacks/receipt`, {
      trackingId: sampleLog.trackingId,
      status: "clicked",
    });
    console.log(`Link click processed: ${clickRes.data.message}`);

    // 8. Simulate purchase checkout order (Campaign conversion)
    console.log("\n7. Simulating shopper checkout purchase ($150 spend)...");
    const checkoutRes = await axios.post(`${CRM_URL}/orders`, {
      customerId: sampleLog.customerId._id,
      amount: 150,
      items: 1,
      trackingId: sampleLog.trackingId,
    });
    console.log(`Checkout completed. Order created with ID: ${checkoutRes.data._id}`);

    // 9. Fetch final statistics and assert conversion success
    console.log("\n8. Fetching updated campaign metrics...");
    const finalDetailsRes = await axios.get(`${CRM_URL}/campaigns/${campaign._id}`);
    const finalCampaignState = finalDetailsRes.data.campaign;

    console.log(`Final Campaign Stats:`);
    console.log(`- Sent count: ${finalCampaignState.sentCount}`);
    console.log(`- Delivered count: ${finalCampaignState.deliveredCount}`);
    console.log(`- Opened count: ${finalCampaignState.openedCount}`);
    console.log(`- Clicked count: ${finalCampaignState.clickedCount}`);
    console.log(`- Converted count: ${finalCampaignState.convertedCount}`);
    console.log(`- Revenue attributed: $${finalCampaignState.totalRevenueGenerated}`);

    if (finalCampaignState.convertedCount !== 1) {
      throw new Error(`Conversion attribution failed. Expected 1 conversion, got ${finalCampaignState.convertedCount}`);
    }

    if (finalCampaignState.totalRevenueGenerated !== 150) {
      throw new Error(`Revenue attribution mismatch. Expected $150, got $${finalCampaignState.totalRevenueGenerated}`);
    }

    console.log("\n=== CRM INTEGRATION TEST PASSED SUCCESSFULLY! ===");
  } catch (error: any) {
    console.error("\n=== CRM INTEGRATION TEST FAILED ===");
    console.error(error.message);
    if (error.response) {
      console.error("API response details:", error.response.data);
    }
    throw error;
  }
}

runTest();
