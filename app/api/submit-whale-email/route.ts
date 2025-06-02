import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';

// Basic email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, walletAddress, portfolioValue, website } = body;

        if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
            return NextResponse.json(
                { message: 'Valid email is required.' },
                { status: 400 }
            );
        }

        if (walletAddress && typeof walletAddress !== 'string') {
            return NextResponse.json(
                { message: 'Invalid wallet address.' },
                { status: 400 }
            );
        }

        if (typeof portfolioValue !== 'number' || portfolioValue < 0) {
            return NextResponse.json(
                { message: 'Valid portfolio value is required.' },
                { status: 400 }
            );
        }

        if (website && typeof website !== 'string') {
            return NextResponse.json(
                { message: 'Invalid website identifier.' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseServer
            .from('Whales')
            .insert([
                {
                    email: email,
                    wallet_address: walletAddress || null,
                    portfolio_value: portfolioValue,
                    website: website || null,
                    created_at: new Date().toISOString(),
                },
            ])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === '23505') { // PostgreSQL unique violation error code
                return NextResponse.json(
                    { message: 'This email or wallet address has already been submitted.' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { message: 'Error saving data to database.', error: error.message },
                { status: 500 }
            );
        }

        // Log successful submission
        console.log('Whale email submission saved:', {
            email,
            walletAddress,
            portfolioValue,
            website,
            data,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            message: 'Email submitted successfully!',
            data
        }, { status: 200 });

    } catch (err) {
        console.error('API route error:', err);
        return NextResponse.json(
            { message: 'Internal server error.', error: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
} 