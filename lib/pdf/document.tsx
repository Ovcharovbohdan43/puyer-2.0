import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/stylesheet";

import type { BuilderState } from "@/components/invoice-builder/types";
import type { Currency } from "@/lib/invoices/currencies";
import type { InvoiceTotals } from "@/lib/invoices/calculate";
import { formatInvoiceDate } from "@/lib/invoices/dates";
import { formatBankTransfer, hasBankTransfer } from "@/lib/invoices/bank-transfer";
import { formatMajorMoney, formatMoney } from "@/lib/invoices/money";
import { INVOICE_PLATFORM_DISCLAIMER } from "@/lib/invoices/disclaimer";
import { INVOICE_NAVY, invoiceTemplateSkin } from "@/lib/invoices/template-layout";
import { ensurePdfFonts } from "@/lib/pdf/fonts";
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
  const accent = state.accentColor === "#000000" ? INVOICE_NAVY : state.accentColor;
  const skin = invoiceTemplateSkin(state.template);
  const taxLabel = state.taxRate.trim() === "" ? "0" : state.taxRate;
  const styles = makeStyles(accent, skin);
  const money = (minor: bigint) => formatMoney(minor, currency.symbol, currency.exponent);
  const unit = (value: string) => formatMajorMoney(value, currency.symbol, currency.exponent);
  const bankBlock = formatBankTransfer(state);
  const showPayment = hasBankTransfer(state) || Boolean(state.paymentDetails.trim());
  const showNotes = Boolean(state.notes.trim());

  return (
    <Document title={state.invoiceNumber} author={state.businessName} producer="Puyer">
      <Page size={paper} style={styles.page} wrap>
        {skin.accentStripe ? <View style={styles.accentStripe} /> : null}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <FlowText style={styles.mark}>{state.businessName || " "}</FlowText>
            {splitLines(state.businessAddress).map((line, index) => (
              <FlowText key={`biz-${index}`} style={styles.muted}>
                {line}
              </FlowText>
            ))}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.monoMuted}>#{state.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaCol}>
            <Text style={styles.kicker}>BILLED TO</Text>
            <FlowText style={styles.client}>{state.clientName || " "}</FlowText>
            {splitLines(state.clientAddress).map((line, index) => (
              <FlowText key={`client-${index}`} style={styles.muted}>
                {line}
              </FlowText>
            ))}
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.kicker}>INVOICE DETAILS</Text>
            <View style={styles.detailRow}>
              <Text style={styles.muted}>Date issued</Text>
              <Text style={styles.detailValue}>{formatInvoiceDate(state.issueDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.muted}>Due date</Text>
              <Text style={styles.detailValue}>{formatInvoiceDate(state.dueDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHead, styles.colDesc]}>DESCRIPTION</Text>
          <Text style={[styles.tableHead, styles.colQty]}>QTY</Text>
          <Text style={[styles.tableHead, styles.colUnit]}>UNIT PRICE</Text>
          <Text style={[styles.tableHead, styles.colTax]}>TAX (%)</Text>
          <Text style={[styles.tableHead, styles.colAmt]}>TOTAL</Text>
        </View>
        {state.items.map((item, index) => (
          <View
            key={`${item.id}-${index}`}
            style={index % 2 === 1 && skin.zebra ? styles.tableRowZebra : styles.tableRow}
          >
            <View style={styles.colDesc}>
              <FlowText style={styles.body}>{item.description || "—"}</FlowText>
            </View>
            <Text style={[styles.mono, styles.colQty]}>{item.quantity || "0"}</Text>
            <Text style={[styles.mono, styles.colUnit]}>{unit(item.unitPrice)}</Text>
            <Text style={[styles.mono, styles.colTax]}>{taxLabel}</Text>
            <Text style={[styles.mono, styles.colAmt]}>{money(totals.lineAmounts[index] ?? 0n)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text style={styles.mono}>{money(totals.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Tax ({taxLabel}%)</Text>
            <Text style={styles.mono}>{money(totals.taxAmount)}</Text>
          </View>
          {totals.discountAmount > 0n ? (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Discount</Text>
              <Text style={styles.mono}>−{money(totals.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalDue}>
            <Text>Total due</Text>
            <Text>{money(totals.total)}</Text>
          </View>
        </View>

        {showPayment ? (
          <View style={styles.footer}>
            <Text style={styles.kickerInk}>PAYMENT INSTRUCTIONS</Text>
            {bankBlock ? (
              <View style={styles.bankBox}>
                <FlowText style={styles.notes}>{bankBlock}</FlowText>
              </View>
            ) : null}
            {state.paymentDetails.trim() ? <FlowText style={styles.notes}>{state.paymentDetails}</FlowText> : null}
            {hasBankTransfer(state) ? (
              <Text style={styles.remit}>
                {`Please include invoice number #${state.invoiceNumber} in remittance.`}
              </Text>
            ) : null}
          </View>
        ) : null}
        {showNotes ? <FlowText style={styles.notes}>{state.notes}</FlowText> : null}

        <FlowText style={styles.disclaimer}>{INVOICE_PLATFORM_DISCLAIMER}</FlowText>
        {branded ? <Text style={styles.brand}>{madeWith}</Text> : null}
      </Page>
    </Document>
  );
}

function makeStyles(accent: string, skin: ReturnType<typeof invoiceTemplateSkin>) {
  const shrink = {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    overflow: "hidden" as const,
  };
  const tableHeadFill = skin.filledTableHead
    ? skin.tableHeadUsesAccent
      ? accent
      : "#F1F5F9"
    : undefined;
  const tableHeadColor = skin.tableHeadUsesAccent ? "#ffffff" : "#45464d";
  const markColor = skin.markUsesAccent ? accent : INVOICE_NAVY;

  return StyleSheet.create({
    page: {
      paddingTop: skin.accentStripe ? 0 : 48,
      paddingBottom: 48,
      paddingHorizontal: 48,
      fontSize: 11,
      fontFamily: "Noto Sans",
      color: INVOICE_NAVY,
    },
    accentStripe: {
      height: 4,
      backgroundColor: accent,
      marginBottom: 28,
      marginHorizontal: -48,
    },
    header: {
      flexDirection: "row",
      width: "100%",
      marginBottom: 28,
    },
    headerLeft: { ...shrink, paddingRight: 16 },
    headerRight: { width: "42%", flexShrink: 0, alignItems: "flex-end" },
    mark: {
      fontSize: 18,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: markColor,
      width: "100%",
    },
    title: {
      fontSize: 20,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      letterSpacing: 0.6,
      textAlign: "right",
    },
    monoMuted: { fontSize: 10, fontFamily: "Courier", color: "#45464d", textAlign: "right" },
    muted: { fontSize: 9, fontFamily: "Noto Sans", color: "#45464d", width: "100%" },
    body: { fontFamily: "Noto Sans", fontSize: 10, color: INVOICE_NAVY },
    mono: { fontSize: 9, fontFamily: "Courier" },
    kicker: {
      fontSize: 8,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: "#64748B",
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    kickerInk: {
      fontSize: 8,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: INVOICE_NAVY,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    client: { fontSize: 12, fontFamily: "Noto Sans", fontWeight: 700, marginBottom: 2, width: "100%" },
    meta: { flexDirection: "row", width: "100%", marginBottom: 22 },
    metaCol: { ...shrink, paddingRight: 16 },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    detailValue: { fontSize: 9, fontFamily: "Noto Sans", fontWeight: 700, textAlign: "right" },
    tableHeader: {
      flexDirection: "row",
      width: "100%",
      backgroundColor: tableHeadFill ?? "transparent",
      borderBottomWidth: skin.filledTableHead ? 0 : 1,
      borderBottomColor: "#e2e8f0",
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    tableHead: {
      fontSize: 7,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: tableHeadColor,
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: "row",
      width: "100%",
      borderBottomWidth: skin.zebra ? 0 : 1,
      borderBottomColor: "#e2e8f0",
      paddingVertical: 7,
      paddingHorizontal: 8,
      alignItems: "flex-start",
    },
    tableRowZebra: {
      flexDirection: "row",
      width: "100%",
      backgroundColor: "#F8FAFC",
      paddingVertical: 7,
      paddingHorizontal: 8,
      alignItems: "flex-start",
    },
    colDesc: { ...shrink, paddingRight: 6 },
    colQty: { width: 32, flexShrink: 0, textAlign: "right" },
    colUnit: { width: 70, flexShrink: 0, textAlign: "right" },
    colTax: { width: 48, flexShrink: 0, textAlign: "right" },
    colAmt: { width: 70, flexShrink: 0, textAlign: "right" },
    totals: { marginTop: 16, alignSelf: "flex-end", width: 220 },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomStyle: "dotted",
      borderBottomColor: "#CBD5E1",
    },
    totalDue: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      fontSize: 11,
      fontFamily: "Noto Sans",
      fontWeight: 700,
      color: skin.filledTotalDue ? "#ffffff" : markColor,
      backgroundColor: skin.filledTotalDue ? accent : "transparent",
    },
    footer: { width: "100%", marginTop: 28 },
    bankBox: {
      borderWidth: 1,
      borderColor: "#e2e8f0",
      backgroundColor: "#F8FAFC",
      padding: 8,
      marginBottom: 6,
    },
    notes: { marginTop: 4, fontSize: 8, fontFamily: "Noto Sans", color: "#45464d", width: "100%" },
    remit: {
      marginTop: 6,
      fontSize: 8,
      fontFamily: "Noto Sans",
      color: "#64748B",
      width: "100%",
    },
    disclaimer: {
      marginTop: 18,
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
