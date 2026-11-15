import { NextRequest, NextResponse } from "next/server";
import { getCustomOrders, createCustomOrder, updateCustomOrderStatus, deleteCustomOrder } from "@/lib/store";

export async function GET() {
  try {
    const orders = await getCustomOrders();
    return NextResponse.json(orders);
  } catch (err) {
    console.error("Custom orders GET error:", err);
    return NextResponse.json({ message: "Failed to fetch custom orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customerName || !body.customerPhone) {
      return NextResponse.json({ message: "Customer details are required" }, { status: 400 });
    }
    const order = await createCustomOrder(body);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("Custom orders POST error:", err);
    return NextResponse.json({ message: "Failed to submit custom order" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, status } = body;
    if (!orderNumber || !status) {
      return NextResponse.json({ message: "orderNumber and status are required" }, { status: 400 });
    }
    await updateCustomOrderStatus(orderNumber, status);
    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("Custom orders PATCH error:", err);
    return NextResponse.json({ message: "Failed to update custom order status" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber");
    if (!orderNumber) {
      return NextResponse.json({ message: "orderNumber query param is required" }, { status: 400 });
    }
    await deleteCustomOrder(orderNumber);
    return NextResponse.json({ success: true, orderNumber });
  } catch (err) {
    console.error("Custom orders DELETE error:", err);
    return NextResponse.json({ message: "Failed to delete custom order" }, { status: 500 });
  }
}
