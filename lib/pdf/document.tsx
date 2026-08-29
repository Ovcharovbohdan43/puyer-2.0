import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/stylesheet";

import type { BuilderState } from "@/components/invoice-builder/types";
import type { Currency } from "@/lib/invoices/currencies";
import type { InvoiceTotals } from "@/lib/invoices/calculate";
import { formatInvoiceDate } from "@/lib/invoices/dates";
import { formatMoney } from "@/lib/invoices/money";
import { ensurePdfFonts } from "@/lib/pdf/fonts";
import { formatBankTransfer } from "@/lib/invoices/bank-transfer";
import { INVOICE_PLATFORM_DISCLAIMER } from "@/lib/invoices/disclaimer";
import { hyphenatePdfWord, wrapPdfText } from "@/lib/pdf/hyphenate";
import type { PaperSize } from "@/lib/pdf/paper";

type InvoicePdfDocumentProps = {
  state: BuilderState;
  currency: Currency;
  totals: InvoiceTotals;
  paper: PaperSize;
  branded: boolean;
  madeWith: string;
};

const NAVY = "#0B1C30";
const MINT = "#6CF8BB";

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).filter((line) => line.length > 0);
}

function FlowText({
  style,
  children,
}: {
  style: Style;
  children: string;
}) {
  return (
    <Text style={style} hyphenationCallback={hyphenatePdfWord} wrap>
      {wrapPdfText(children)}
    </Text>
  );
}

export function InvoicePdfDocument({
  state,
  currency,
  totals,
  paper,
  branded,
  madeWith,
}: InvoicePdfDocumentProps) {
  ensurePdfFonts();
  const accent = state.accentColor === "#000000" ? "#0b1c30" : state.accentColor;
  const isMinimal = state.template === "MINIMAL";
  const isPremium = state.template === "PREMIUM";
  const taxLabel = state.taxRate.trim() === "" ? "0" : state.taxRate;
  const styles = makeStyles(accent, isMinimal, isPremium);
  const money = (minor: bigint) => formatMoney(minor, currency.symbol, currency.exponent);
  const bankBlock = formatBankTransfer(state);

  return (
    <Document title={state.invoiceNumber} author={state.businessName} producer="Puyer">
      <Page size={paper} style={isPremium ? styles.pageFlush : styles.page} wrap>
        {isPremium ? (
          <View style={styles.premiumBand}>
            <View style={styles.premiumAccent} />
            <View style={styles.premiumBandInner}>
              <View style={styles.headerLeft}>
                <Text style={styles.premiumKicker}>INVOICE</Text>
                <Text style={styles.premiumNumber}>#{state.invoiceNumber}</Text>
              </View>
              <View style={styles.headerRight}>
                <FlowText style={styles.premiumBusiness}>{state.businessName || " "}</FlowText>
                {splitLines(state.businessAddress).map((line, index) => (
                  <FlowText key={`biz-${index}`} style={styles.premiumMutedRight}>
                    {line}
                  </FlowText>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>INVOICE</Text>
              <Text style={styles.mono}>#{state.invoiceNumber}</Text>
            </View>
            <View style={styles.headerRight}>
              {isMinimal ? null : <View style={styles.blob} />}
              <FlowText style={styles.business}>{state.businessName || " "}</FlowText>
              {splitLines(state.businessAddress).map((line, index) => (
                <FlowText key={`biz-${index}`} style={styles.mutedRight}>
                  {line}
                </FlowText>
              ))}
            </View>
          </View>
        )}

        <View style={isPremium ? styles.bodyPad : styles.bodyPlain}>
          <View style={isPremium ? styles.metaCard : styles.meta}>
            <View style={styles.metaCol}>
              <Text style={styles.label}>Billed To</Text>
              <FlowText style={styles.client}>{state.clientName || " "}</FlowText>
              {splitLines(state.clientAddress).map((line, index) => (
                <FlowText key={`client-${index}`} style={styles.muted}>
                  {line}
                </FlowText>
              ))}
            </View>
            <View style={styles.metaDates}>
              <View style={styles.dateRow}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.mono}>{formatInvoiceDate(state.issueDate)}</Text>
              </View>
              <View style={styles.dateRow}>
                <Text style={styles.label}>Due Date</Text>
                <Text style={styles.mono}>{formatInvoiceDate(state.dueDate)}</Text>
              </View>
            </View>
          </View>

          <View style={isPremium ? styles.tableHeaderPremium : styles.tableHeader}>
            <Text style={[isPremium ? styles.tableHeadPremium : styles.label, styles.colDesc]}>Description</Text>
            <Text style={[isPremium ? styles.tableHeadPremium : styles.label, styles.colQty]}>Qty</Text>
            <Text style={[isPremium ? styles.tableHeadPremium : styles.label, styles.colAmt]}>Amount</Text>
          </View>
          {state.items.map((item, index) => (
            <View key={`${item.id}-${index}`} style={isPremium ? styles.tableRowPremium : styles.tableRow}>
              <View style={styles.colDesc}>
                <FlowText style={styles.body}>{item.description || "—"}</FlowText>
              </View>
              <Text style={[styles.mono, styles.colQty]}>{item.quantity || "0"}</Text>
              <Text style={[styles.mono, styles.colAmt]}>{money(totals.lineAmounts[index] ?? 0n)}</Text>
            </View>
          ))}

          <View style={isPremium ? styles.totalsPremium : styles.totals}>
            <View style={styles.totalRow}>
              <Text style={isPremium ? styles.premiumMuted : styles.muted}>Subtotal</Text>
              <Text style={isPremium ? styles.premiumMono : styles.mono}>{money(totals.subtotal)}</Text>
            </View>
            {totals.discountAmount > 0n ? (
              <View style={styles.totalRow}>
                <Text style={isPremium ? styles.premiumMuted : styles.muted}>Discount</Text>
                <Text style={isPremium ? styles.premiumMono : styles.mono}>−{money(totals.discountAmount)}</Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={isPremium ? styles.premiumMuted : styles.muted}>Tax ({taxLabel}%)</Text>
              <Text style={isPremium ? styles.premiumMono : styles.mono}>{money(totals.taxAmount)}</Text>
            </View>
            <View style={isPremium ? styles.totalRowPremium : styles.totalRowStrong}>
              <Text>Total</Text>
              <Text>{money(totals.total)}</Text>
            </View>
          </View>

          {bankBlock ? <FlowText style={styles.notes}>{bankBlock}</FlowText> : null}
          {state.paymentDetails ? <FlowText style={styles.notes}>{state.paymentDetails}</FlowText> : null}
          {state.notes ? <FlowText style={styles.notes}>{state.notes}</FlowText> : null}
          <FlowText style={styles.disclaimer}>{INVOICE_PLATFORM_DISCLAIMER}</FlowText>
        </View>
        {branded ? <Text style={styles.brand}>{madeWith}</Text> : null}
      </Page>
    </Document>
  );
}

function makeStyles(accent: string, isMinimal: boolean, isPremium: boolean) {
  const shrink = {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    overflow: "hidden" as const,
  };
  return StyleSheet.create({
    page: {
      paddingTop: 48,
      paddingBottom: 48,
      paddingHorizontal: 48,
      fontSize: 11,
      fontFamily: "Noto Sans",
      color: "#0b1c30",
    },
    pageFlush: {
      paddingTop: 0,
      paddingBottom: 48,
      paddingHorizontal: 0,
      fontSize: 11,
      fontFamily: "Noto Sans",
      color: "#0b1c30",
    },
    bodyPad: {
      paddingHorizontal: 48,
      paddingTop: 24,
    },
    bodyPlain: {
      width: "100%",
    },
    body: { fontFamily: "Noto Sans", fontSize: 11, color: "#0b1c30" },
    premiumBand: {
      backgroundColor: NAVY,
      width: "100%",
    },
    premiumAccent: {
      height: 6,
      backgroundColor: accent,
    },
    premiumBandInner: {
      flexDirection: "row",
      width: "100%",
      paddingHorizontal: 48,
      paddingVertical: 28,
    },
    premiumKicker: {
      fontSize: 10,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: MINT,
      letterSpacing: 2,
    },
    premiumNumber: {
      marginTop: 8,
      fontSize: 20,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: "#ffffff",
    },
    premiumBusiness: {
      fontSize: 14,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: "#ffffff",
      textAlign: "right",
      width: "100%",
    },
    premiumMutedRight: {
      fontSize: 10,
      fontFamily: "Noto Sans",
      color: "#94A3B8",
      textAlign: "right",
      width: "100%",
    },
    premiumMuted: { fontSize: 10, fontFamily: "Noto Sans", color: "#94A3B8" },
    premiumMono: { fontSize: 10, fontFamily: "Courier", color: "#ffffff" },
    header: {
      flexDirection: "row",
      width: "100%",
      paddingBottom: 16,
      borderBottomWidth: isMinimal ? 1 : 2,
      borderBottomColor: isMinimal ? "#e2e8f0" : accent,
      marginBottom: 24,
    },
    headerLeft: { width: "38%", paddingRight: 12, flexShrink: 0 },
    headerRight: { ...shrink, maxWidth: "62%", alignItems: "flex-end" },
    title: {
      fontSize: isMinimal ? 16 : 22,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: isMinimal ? "#0b1c30" : accent,
      letterSpacing: isMinimal ? 3 : 1,
    },
    blob: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: accent,
      marginBottom: 8,
    },
    business: {
      fontSize: 14,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      textAlign: "right",
      width: "100%",
    },
    muted: { fontSize: 10, fontFamily: "Noto Sans", color: "#45464d", width: "100%" },
    mutedRight: {
      fontSize: 10,
      fontFamily: "Noto Sans",
      color: "#45464d",
      textAlign: "right",
      width: "100%",
    },
    mono: { fontSize: 10, fontFamily: "Courier" },
    meta: { flexDirection: "row", width: "100%", marginBottom: 24 },
    metaCard: {
      flexDirection: "row",
      width: "100%",
      marginBottom: 20,
      padding: 12,
      backgroundColor: "#F8FAFC",
    },
    metaCol: { ...shrink, paddingRight: 16 },
    metaDates: { width: 140, flexShrink: 0 },
    label: { fontSize: 9, fontFamily: "Noto Sans", color: "#45464d", letterSpacing: 0.6, marginBottom: 4 },
    client: { fontSize: 12, fontFamily: "Noto Sans", fontWeight: 700, marginBottom: 2, width: "100%" },
    dateRow: { marginBottom: 8 },
    tableHeader: {
      flexDirection: "row",
      width: "100%",
      borderBottomWidth: isMinimal ? 1 : 2,
      borderBottomColor: isMinimal ? "#e2e8f0" : accent,
      paddingBottom: 6,
      marginBottom: 4,
    },
    tableHeaderPremium: {
      flexDirection: "row",
      width: "100%",
      backgroundColor: accent,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    tableHeadPremium: {
      fontSize: 9,
      fontFamily: "Noto Sans",
      color: "#ffffff",
      letterSpacing: 0.6,
      fontWeight: 700,
    },
    tableRow: {
      flexDirection: "row",
      width: "100%",
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
      paddingVertical: 6,
      alignItems: "flex-start",
    },
    tableRowPremium: {
      flexDirection: "row",
      width: "100%",
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: "#e2e8f0",
      paddingVertical: 6,
      paddingHorizontal: 10,
      alignItems: "flex-start",
    },
    colDesc: { ...shrink, paddingRight: 8 },
    colQty: { width: 50, flexShrink: 0, textAlign: "right" },
    colAmt: { width: 90, flexShrink: 0, textAlign: "right" },
    totals: { marginTop: 16, alignSelf: "flex-end", width: 220 },
    totalsPremium: {
      marginTop: 16,
      alignSelf: "flex-end",
      width: 240,
      backgroundColor: NAVY,
      padding: 12,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      borderBottomWidth: isPremium ? 0 : 1,
      borderBottomColor: "#e2e8f0",
    },
    totalRowStrong: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 10,
      fontSize: 14,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: isMinimal ? NAVY : accent,
    },
    totalRowPremium: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 10,
      fontSize: 14,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: MINT,
    },
    notes: { marginTop: 20, fontSize: 10, fontFamily: "Noto Sans", color: "#45464d", width: "100%" },
    disclaimer: {
      marginTop: 16,
      fontSize: 7,
      fontFamily: "Noto Sans",
      color: "#7c839b",
      width: "100%",
      lineHeight: 1.35,
    },
    brand: {
      position: "absolute",
      bottom: 28,
      left: 48,
      right: 48,
      textAlign: "center",
      fontSize: 8,
      fontFamily: "Noto Sans",
      color: "#7c839b",
      letterSpacing: 0.4,
    },
  });
}
