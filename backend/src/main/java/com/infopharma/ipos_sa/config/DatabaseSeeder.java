package com.infopharma.ipos_sa.config;

import com.infopharma.ipos_sa.entity.*;
import com.infopharma.ipos_sa.entity.Order.OrderStatus;
import com.infopharma.ipos_sa.entity.Order.PaymentStatus;
import com.infopharma.ipos_sa.entity.UserAccount.AccountStatus;
import com.infopharma.ipos_sa.entity.UserAccount.AccountType;
import com.infopharma.ipos_sa.entity.Payment.PaymentMethod;
import com.infopharma.ipos_sa.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Seeds the database with demo data on first startup only.
 * Automatically skipped if user_accounts already has rows.
 */
@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserAccountRepository   accounts;
    private final DiscountPlanRepository  plans;
    private final DiscountTierRepository  tiers;
    private final CatalogueItemRepository catalogue;
    private final OrderRepository         orders;
    private final OrderItemRepository     orderItems;
    private final InvoiceRepository       invoices;
    private final PaymentRepository       payments;
    private final StockDeliveryRepository stockDeliveries;

    public DatabaseSeeder(
            UserAccountRepository accounts,
            DiscountPlanRepository plans,
            DiscountTierRepository tiers,
            CatalogueItemRepository catalogue,
            OrderRepository orders,
            OrderItemRepository orderItems,
            InvoiceRepository invoices,
            PaymentRepository payments,
            StockDeliveryRepository stockDeliveries) {
        this.accounts        = accounts;
        this.plans           = plans;
        this.tiers           = tiers;
        this.catalogue       = catalogue;
        this.orders          = orders;
        this.orderItems      = orderItems;
        this.invoices        = invoices;
        this.payments        = payments;
        this.stockDeliveries = stockDeliveries;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (accounts.count() > 0) return; // already seeded

        // ── 1. Discount plans ─────────────────────────────────────────────

        // Plan A: Fixed 3% (CityPharmacy)
        DiscountPlan fixedPlan = plans.save(plan(DiscountPlan.PlanType.FIXED));
        tiers.save(tier(fixedPlan, "0.00", null,      "3.00"));

        // Plan B: Flexible 0/1/2% (Cosymed)
        DiscountPlan flexPlan1 = plans.save(plan(DiscountPlan.PlanType.FLEXIBLE));
        tiers.save(tier(flexPlan1, "0.00",    "1000.00", "0.00"));
        tiers.save(tier(flexPlan1, "1000.00", "2000.00", "1.00"));
        tiers.save(tier(flexPlan1, "2000.00", null,      "2.00"));

        // Plan C: Flexible 0/1/3% (HelloPharmacy)
        DiscountPlan flexPlan2 = plans.save(plan(DiscountPlan.PlanType.FLEXIBLE));
        tiers.save(tier(flexPlan2, "0.00",    "1000.00", "0.00"));
        tiers.save(tier(flexPlan2, "1000.00", "2000.00", "1.00"));
        tiers.save(tier(flexPlan2, "2000.00", null,      "3.00"));

        // ── 2. Staff accounts ─────────────────────────────────────────────

        staff("Sysdba",     "London_weighting", AccountType.ADMIN,   "admin@infopharma.co.uk");
        staff("manager",    "Get_it_done",      AccountType.MANAGER, "manager@infopharma.co.uk");
        staff("accountant", "Count_money",      AccountType.MANAGER, "acct@infopharma.co.uk");
        staff("clerk",      "Paperwork",        AccountType.MANAGER, "clerk@infopharma.co.uk");
        staff("warehouse1", "Get_a_beer",       AccountType.MANAGER, "wh1@infopharma.co.uk");
        staff("warehouse2", "Lot_smell",        AccountType.MANAGER, "wh2@infopharma.co.uk");
        staff("delivery",   "Too_dark",         AccountType.MANAGER, "del@infopharma.co.uk");

        // ── 3. Merchant accounts ──────────────────────────────────────────

        UserAccount city = accounts.save(merchant(
                "city", "northampton",
                "Prof David Rhind", "CityPharmacy",
                "Northampton Square, London EC1V 0HB",
                "0207 040 8000", "city@citypharmacy.co.uk",
                "10000.00", "0.00", AccountStatus.NORMAL, null, fixedPlan));

        UserAccount cosymed = accounts.save(merchant(
                "cosymed", "bondstreet",
                "Mr Alex Wright", "Cosymed Ltd",
                "25, Bond Street, London WC1V 8LS",
                "0207 321 8001", "cosymed@cosymed.co.uk",
                "5000.00", "0.00", AccountStatus.NORMAL, null, flexPlan1));

        UserAccount hello = accounts.save(merchant(
                "hello", "there",
                "Mr Bruno Wright", "HelloPharmacy",
                "12, Bond Street, London WC1V 9NS",
                "0207 321 8002", "hello@hellopharmacy.co.uk",
                "5000.00", "1750.00", AccountStatus.SUSPENDED,
                LocalDate.of(2026, 2, 28), flexPlan2));

        // ── 4. Catalogue items ────────────────────────────────────────────

        CatalogueItem p001 = item("100 00001", "Paracetamol",           "box",    "Caps", 20,  "0.10",  10285, 300, "10.00");
        CatalogueItem p002 = item("100 00002", "Aspirin",               "box",    "Caps", 20,  "0.50",  12453, 500, "10.00");
        CatalogueItem p003 = item("100 00003", "Analgin",               "box",    "Caps", 10,  "1.20",  4115,  200, "10.00");
        CatalogueItem p004 = item("100 00004", "Celebrex, caps 100 mg", "box",    "Caps", 10,  "10.00", 3410,  200, "15.00");
                             item("100 00005", "Celebrex, caps 200 mg", "box",    "Caps", 10,  "18.50", 1440,  150, "15.00");
                             item("100 00006", "Retin-A Tretin, 30 g",  "box",    "Caps", 20,  "25.00", 2003,  200, "10.00");
        CatalogueItem p007 = item("100 00007", "Lipitor TB, 20 mg",     "box",    "Caps", 30,  "15.50", 1542,  200, "10.00");
        CatalogueItem p008 = item("100 00008", "Claritin CR, 60g",      "box",    "Caps", 20,  "19.50", 2540,  200, "10.00");
        CatalogueItem b004 = item("200 00004", "Iodine tincture",       "bottle", "ml",   100, "0.30",  87,    200, "10.00");
                             item("200 00005", "Rhynol",                "bottle", "ml",   200, "2.50",  1878,  300, "10.00");
                             item("300 00001", "Ospen",                 "box",    "Caps", 20,  "10.50", 776,   200, "10.00");
                             item("300 00002", "Amopen",                "box",    "Caps", 30,  "15.00", 1230,  300, "10.00");
                             item("400 00001", "Vitamin C",             "box",    "Caps", 30,  "1.20",  3218,  300, "10.00");
                             item("400 00002", "Vitamin B12",           "box",    "Caps", 30,  "1.30",  2573,  300, "10.00");

        // ── 5. Historical orders ──────────────────────────────────────────

        // CityPharmacy — Jan 2026, DELIVERED, PAID (3% discount)
        Order ip0001 = orders.save(Order.builder()
                .orderId("IP0001").account(city)
                .orderDate(LocalDate.of(2026, 1, 15))
                .totalValue(bd("184.30")).discountApplied(bd("5.70"))
                .status(OrderStatus.DELIVERED).paymentStatus(PaymentStatus.PAID)
                .dispatchedBy("warehouse1").dispatchDate(LocalDate.of(2026, 1, 17))
                .courier("DHL").courierRef("DHL7001")
                .expectedDelivery(LocalDate.of(2026, 1, 21))
                .deliveryDate(LocalDate.of(2026, 1, 20)).build());
        orderItems.save(oi(ip0001, p001, 200, "0.10",  "20.00"));
        orderItems.save(oi(ip0001, p002, 100, "0.50",  "50.00"));
        orderItems.save(oi(ip0001, p003, 100, "1.20", "120.00"));
        Invoice inv1 = invoices.save(inv("100001", ip0001, city, "2026-01-15", "184.30"));
        payments.save(pay(city, inv1, "2026-01-20", "184.30", PaymentMethod.BANK_TRANSFER));

        // CityPharmacy — Feb 2026, DELIVERED, PAID
        Order ip0002 = orders.save(Order.builder()
                .orderId("IP0002").account(city)
                .orderDate(LocalDate.of(2026, 2, 10))
                .totalValue(bd("785.70")).discountApplied(bd("24.30"))
                .status(OrderStatus.DELIVERED).paymentStatus(PaymentStatus.PAID)
                .dispatchedBy("warehouse2").dispatchDate(LocalDate.of(2026, 2, 12))
                .courier("DHL").courierRef("DHL7002")
                .expectedDelivery(LocalDate.of(2026, 2, 17))
                .deliveryDate(LocalDate.of(2026, 2, 15)).build());
        orderItems.save(oi(ip0002, p004, 50, "10.00", "500.00"));
        orderItems.save(oi(ip0002, p007, 20, "15.50", "310.00"));
        Invoice inv2 = invoices.save(inv("100002", ip0002, city, "2026-02-10", "785.70"));
        payments.save(pay(city, inv2, "2026-02-18", "785.70", PaymentMethod.BANK_TRANSFER));

        // Cosymed — Jan 2026, DELIVERED, PAID
        Order ip0003 = orders.save(Order.builder()
                .orderId("IP0003").account(cosymed)
                .orderDate(LocalDate.of(2026, 1, 20))
                .totalValue(bd("975.00")).discountApplied(BigDecimal.ZERO)
                .status(OrderStatus.DELIVERED).paymentStatus(PaymentStatus.PAID)
                .dispatchedBy("warehouse1").dispatchDate(LocalDate.of(2026, 1, 22))
                .courier("Royal Mail").courierRef("RM5001")
                .expectedDelivery(LocalDate.of(2026, 1, 27))
                .deliveryDate(LocalDate.of(2026, 1, 25)).build());
        orderItems.save(oi(ip0003, p008, 50, "19.50", "975.00"));
        Invoice inv3 = invoices.save(inv("100003", ip0003, cosymed, "2026-01-20", "975.00"));
        payments.save(pay(cosymed, inv3, "2026-02-01", "975.00", PaymentMethod.CHEQUE));

        // HelloPharmacy — Jan 2026, DELIVERED, PENDING (explains £1750 balance + SUSPENDED)
        Order ip0004 = orders.save(Order.builder()
                .orderId("IP0004").account(hello)
                .orderDate(LocalDate.of(2026, 1, 29))
                .totalValue(bd("1750.00")).discountApplied(BigDecimal.ZERO)
                .status(OrderStatus.DELIVERED).paymentStatus(PaymentStatus.PENDING)
                .dispatchedBy("warehouse2").dispatchDate(LocalDate.of(2026, 1, 31))
                .courier("DHL").courierRef("DHL7004")
                .expectedDelivery(LocalDate.of(2026, 2, 5))
                .deliveryDate(LocalDate.of(2026, 2, 4)).build());
        orderItems.save(oi(ip0004, p007, 50, "15.50",  "775.00"));
        orderItems.save(oi(ip0004, p008, 50, "19.50",  "975.00"));
        invoices.save(inv("100004", ip0004, hello, "2026-01-29", "1750.00"));
        // No payment — HelloPharmacy balance remains 1750.00

        // ── 6. Stock deliveries ───────────────────────────────────────────

        sd(p001, 2000, LocalDate.of(2026, 1, 5),  "warehouse1");
        sd(p002,  500, LocalDate.of(2026, 1, 5),  "warehouse1");
        sd(p004,  200, LocalDate.of(2026, 2, 3),  "warehouse2");
        sd(b004,  300, LocalDate.of(2026, 1, 8),  "warehouse1");
        sd(p007,  300, LocalDate.of(2026, 2, 3),  "warehouse2");
    }

    // ── Tiny builder helpers to keep run() readable ───────────────────────────

    private DiscountPlan plan(DiscountPlan.PlanType type) {
        DiscountPlan p = new DiscountPlan();
        p.setPlanType(type);
        return p;
    }

    private DiscountTier tier(DiscountPlan plan, String min, String max, String rate) {
        DiscountTier t = new DiscountTier();
        t.setDiscountPlan(plan);
        t.setMinValue(new BigDecimal(min));
        t.setMaxValue(max != null ? new BigDecimal(max) : null);
        t.setDiscountRate(new BigDecimal(rate));
        return t;
    }

    private void staff(String username, String password, AccountType type, String email) {
        UserAccount a = new UserAccount();
        a.setUsername(username); a.setPassword(password);
        a.setAccountType(type); a.setAccountStatus(AccountStatus.NORMAL);
        a.setIsActive(true); a.setPhone("000"); a.setEmail(email);
        a.setBalance(BigDecimal.ZERO);
        accounts.save(a);
    }

    private UserAccount merchant(String username, String password,
                                  String contactName, String companyName, String address,
                                  String phone, String email,
                                  String creditLimit, String balance,
                                  AccountStatus status, LocalDate paymentDueDate,
                                  DiscountPlan discountPlan) {
        UserAccount a = new UserAccount();
        a.setUsername(username); a.setPassword(password);
        a.setAccountType(AccountType.MERCHANT); a.setAccountStatus(status);
        a.setIsActive(true);
        a.setContactName(contactName); a.setCompanyName(companyName);
        a.setAddress(address); a.setPhone(phone); a.setEmail(email);
        a.setCreditLimit(new BigDecimal(creditLimit));
        a.setBalance(new BigDecimal(balance));
        a.setPaymentDueDate(paymentDueDate);
        a.setDiscountPlan(discountPlan);
        return a;
    }

    private CatalogueItem item(String id, String desc, String pkgType, String unit,
                                int unitsInPack, String cost, int avail, int minStock, String bufPct) {
        CatalogueItem i = new CatalogueItem();
        i.setItemId(id); i.setDescription(desc); i.setPackageType(pkgType); i.setUnit(unit);
        i.setUnitsInPack(unitsInPack); i.setPackageCost(new BigDecimal(cost));
        i.setAvailability(avail); i.setMinStockLevel(minStock);
        i.setReorderBufferPct(new BigDecimal(bufPct));
        return catalogue.save(i);
    }

    private OrderItem oi(Order order, CatalogueItem item, int qty, String unitCost, String totalCost) {
        OrderItem oi = new OrderItem();
        oi.setOrder(order); oi.setItem(item); oi.setQuantity(qty);
        oi.setUnitCost(new BigDecimal(unitCost));
        oi.setTotalCost(new BigDecimal(totalCost));
        return oi;
    }

    private Invoice inv(String id, Order order, UserAccount account, String date, String amount) {
        return Invoice.builder()
                .invoiceId(id).order(order).account(account)
                .invoiceDate(LocalDate.parse(date))
                .amountDue(new BigDecimal(amount)).build();
    }

    private Payment pay(UserAccount account, Invoice invoice, String date,
                         String amount, PaymentMethod method) {
        return Payment.builder()
                .account(account).invoice(invoice)
                .paymentDate(LocalDate.parse(date))
                .amountPaid(new BigDecimal(amount))
                .paymentMethod(method).recordedBy("accountant").build();
    }

    private void sd(CatalogueItem item, int qty, LocalDate date, String by) {
        StockDelivery sd = new StockDelivery();
        sd.setItem(item); sd.setQuantityReceived(qty);
        sd.setDeliveryDate(date); sd.setRecordedBy(by);
        stockDeliveries.save(sd);
    }

    private static BigDecimal bd(String val) { return new BigDecimal(val); }
}
