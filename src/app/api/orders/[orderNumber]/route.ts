import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber, updateOrderStatus, deleteOrder } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await context.params;
    const order = await getOrderByNumber(orderNumber);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (err) {
    console.error("Order GET error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "superadmin" && user.role !== "admin" && user.role !== "order_manager")) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    }

    const { orderNumber } = await context.params;
    const { status, trackingNumber, internalNotes, paymentStatus } = await req.json();

    const updated = await updateOrderStatus(orderNumber, status, trackingNumber, internalNotes, paymentStatus);
    if (!updated) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Order PATCH error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "superadmin" && user.role !== "admin" && user.role !== "order_manager")) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    }

    const { orderNumber } = await context.params;
    const deleted = await deleteOrder(orderNumber);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    console.error("Order DELETE error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
