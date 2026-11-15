import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug, updateProduct, deleteProduct } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const product = await getProductBySlug(id);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (err) {
    console.error("Product GET error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const isDev = process.env.NODE_ENV !== "production";
    const isAllowed =
      isDev ||
      (user &&
        (user.role === "superadmin" ||
          user.role === "admin" ||
          user.role === "product_manager" ||
          user.role === "brand_manager" ||
          user.role === "vendor"));

    if (!isAllowed) {
      return NextResponse.json({ message: "Unauthorized. Admin or Brand Manager access required." }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await getProductBySlug(id);
    if (!existing) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    // If Brand Manager, ensure they own this product
    if (user && (user.role === "brand_manager" || user.role === "vendor")) {
      if (user.brandSlug && existing.brand.toLowerCase() !== user.brandSlug.toLowerCase()) {
        return NextResponse.json(
          { message: "Forbidden: You are only permitted to edit items belonging to your brand." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();

    // Prevent brand manager from reassigning the product to another brand
    if (user && (user.role === "brand_manager" || user.role === "vendor")) {
      delete body.brand;
    }

    const updated = await updateProduct(existing._id || id, body);
    if (!updated) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Product PUT error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const isDev = process.env.NODE_ENV !== "production";
    const isAllowed =
      isDev ||
      (user &&
        (user.role === "superadmin" ||
          user.role === "admin" ||
          user.role === "brand_manager" ||
          user.role === "vendor"));

    if (!isAllowed) {
      return NextResponse.json({ message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await getProductBySlug(id);
    if (!existing) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    // If Brand Manager, ensure they own this product
    if (user && (user.role === "brand_manager" || user.role === "vendor")) {
      if (user.brandSlug && existing.brand.toLowerCase() !== user.brandSlug.toLowerCase()) {
        return NextResponse.json(
          { message: "Forbidden: You can only delete products belonging to your own brand store." },
          { status: 403 }
        );
      }
    }

    const deleted = await deleteProduct(existing._id || id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    console.error("Product DELETE error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
