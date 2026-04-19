import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export async function POST(req) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: "ID do pedido não fornecido" }, { status: 400 });
        }

        // Suporte a múltiplos IDs separados por vírgula
        const orderIds = orderId.split(',');
        let allItems = [];
        let totalSum = 0;

        for (const id of orderIds) {
            const docRef = doc(db, "orders", id.trim());
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const order = docSnap.data();
                totalSum += order.total;
                
                // Concatenar itens de todos os pedidos
                const currentOrderItems = order.items.map(item => ({
                    id: item.id,
                    title: `${item.name} (Tam: ${item.selectedSize})`,
                    quantity: item.quantity,
                    unit_price: order.total / order.items.reduce((acc, i) => acc + i.quantity, 0),
                    currency_id: 'BRL'
                }));
                allItems = [...allItems, ...currentOrderItems];
            }
        }

        if (allItems.length === 0) {
            return NextResponse.json({ error: "Pedidos não encontrados" }, { status: 404 });
        }

        // 2. Montar Preferência para o Checkout Pro
        const preference = new Preference(client);
        
        const host = req.headers.get('host');
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const body = {
            items: allItems,
            back_urls: {
                success: `${baseUrl}/pagamento/${orderId}?status=success`,
                failure: `${baseUrl}/pagamento/${orderId}?status=failure`,
                pending: `${baseUrl}/pagamento/${orderId}?status=pending`
            },
            auto_return: 'approved',
            notification_url: `${baseUrl}/api/webhook`,
            external_reference: orderId // Mantém a lista de IDs para o Webhook processar todos
        };

        const response = await preference.create({ body });

        return NextResponse.json({ init_point: response.init_point });

    } catch (error) {
        console.error("Erro ao criar preferência:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
