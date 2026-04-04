import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Greet } from "../wailsjs/go/main/App";

function App() {
    const [resultText, setResultText] = useState("Please enter your name below 👇");
    const [name, setName] = useState('');

    const updateName = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);
    const updateResultText = (result: string) => setResultText(result);

    function greet() {
        Greet(name).then(updateResultText);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#1b2636]">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle className="text-center">Welcome</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center text-lg font-medium">{resultText}</div>
                    <div className="flex gap-2">
                        <Input
                            value={name}
                            onChange={updateName}
                            placeholder="Enter your name"
                            autoComplete="off"
                        />
                        <Button onClick={greet}>Greet</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default App
