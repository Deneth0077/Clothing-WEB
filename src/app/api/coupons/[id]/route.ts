import { NextRequest, NextResponse } from "next/server";
import { updateCoupon, deleteCoupon, getCoupons } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const coupons = await getCoupons();
    const coupon = coupons.find(
      (c) => c._id === id || c.code.toUpperCase() === id.toUpperCase()
    );
    if (!coupon) {
      return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json(coupon);
  } catch (err) {
    console.error("Coupon GET error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const updated = await updateCoupon(id, body);
    if (!updated) {
      return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Coupon PUT error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    }

    const { id } = await context.params;
    const success = await deleteCoupon(id);
    return NextResponse.json({ success });
  } catch (err) {
    console.error("Coupon DELETE error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
