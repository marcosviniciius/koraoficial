import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { NextResponse } from 'next/server';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export async function POST(req) {
    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get('topic');
        const id = url.searchParams.get('id') || url.searchParams.get('data.id');

        // Mercado Pago envia o ID via query param
        if (topic === 'payment' || req.body) {
            const paymentId = id;
            
            if (!paymentId) return NextResponse.json({ ok: true });

            // 1. Buscar detalhes do pagamento no Mercado Pago
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: paymentId });

            if (paymentData.status === 'approved') {
                const combinedOrderIds = paymentData.external_reference;

                if (!combinedOrderIds) return NextResponse.json({ ok: true });

                const orderIds = combinedOrderIds.split(',');

                for (const orderId of orderIds) {
                    const cleanOrderId = orderId.trim();
                    // 2. Buscar pedido no Firestore
                    const orderRef = doc(db, "orders", cleanOrderId);
                    const orderSnap = await getDoc(orderRef);

                    if (orderSnap.exists()) {
                        const order = orderSnap.data();

                        // Evitar processamento duplo (Idempotência)
                        if (order.status !== 'Pago' && order.status !== 'Concluído') {
                            
                            // 3. Atualizar Status do Pedido
                            await updateDoc(orderRef, { 
                                status: "Pago",
                                mercadoPagoId: paymentId,
                                paidAt: new Date()
                            });

                            // 4. Decrementar Estoque
                            for (const item of order.items) {
                                const productRef = doc(db, "products", item.id);
                                const productSnap = await getDoc(productRef);
                                
                                if (productSnap.exists()) {
                                    const stock = productSnap.data().stock || {};
                                    const currentStockQty = stock[item.selectedSize] || 0;
                                    
                                    // Decrementa se houver estoque (Pronta Entrega)
                                    if (currentStockQty > 0) {
                                        await updateDoc(productRef, {
                                            [`stock.${item.selectedSize}`]: increment(-item.quantity)
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("Erro no Webhook:", error);
        return NextResponse.json({ error: error.message }, { status: 200 });
    }
}
