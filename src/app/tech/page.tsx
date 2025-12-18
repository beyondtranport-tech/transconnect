import FreightMatcher from "./freight-matcher";

export default function TechPage() {
    return (
        <div className="bg-background min-h-full">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">TransConnect Tech</h1>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                        Leverage our powerful AI tools to optimize your routes, reduce empty miles, and maximize your profits.
                    </p>
                </div>

                <FreightMatcher />
                
            </div>
        </div>
    );
}
