import Header from '@/components/Header';
import Booking from '@/components/Booking';
import Footer from '@/components/Footer';

const AgendaPage = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main>
                <Booking />
            </main>
            <Footer />
        </div>
    );
};

export default AgendaPage;
