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

        // 1. Buscar pedido no Firestore
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
        }

        const order = docSnap.data();

        // 2. Montar Preferência para o Checkout Pro
        const preference = new Preference(client);
        
        const host = req.headers.get('host');
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const body = {
            items: order.items.map(item => ({
                id: item.id,
                title: `${item.name} (Tam: ${item.selectedSize})`,
                quantity: item.quantity,
                unit_price: order.total / order.items.reduce((acc, i) => acc + i.quantity, 0), // Preço unitário médio se o total vier fechado
                currency_id: 'BRL'
            })),
            back_urls: {
                success: `${baseUrl}/pagamento/${orderId}?status=success`,
                failure: `${baseUrl}/pagamento/${orderId}?status=failure`,
                pending: `${baseUrl}/pagamento/${orderId}?status=pending`
            },
            auto_return: 'approved',
            notification_url: `${baseUrl}/api/webhook`, // O MP chamará essa rota
            external_reference: orderId // Muito importante para o Webhook saber qual pedido é
        };

        const response = await preference.create({ body });

        return NextResponse.json({ init_point: response.init_point });

    } catch (error) {
        console.error("Erro ao criar preferência:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
