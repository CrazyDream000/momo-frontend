
import { FC, useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";


type PhantomEvent = "disconnect" | "connect" | "accountChanged";

interface ConnectOpts {
    onlyIfTrusted: boolean;
}

interface PhantomProvider {
    connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
    disconnect: ()=>Promise<void>;
    on: (event: PhantomEvent, callback: (args:any)=>void) => void;
    isPhantom: boolean;
}

type WindowWithSolana = Window & { 
    solana?: PhantomProvider;
}



const Connect2Phantom: FC = () => {

    const [ walletAvail, setWalletAvail ] = useState(false);
    const [ provider, setProvider ] = useState<PhantomProvider | null>(null);
    const [ connected, setConnected ] = useState(false);
    const [ showDisconnect, setShowDisconnect] = useState(false);
    const [ pubKey, setPubKey ] = useState<PublicKey | null>(null);


    useEffect( ()=>{
        if ("solana" in window) {
            const solWindow = window as WindowWithSolana;
            if (solWindow?.solana?.isPhantom) {
                setProvider(solWindow.solana);
                setWalletAvail(true);
                // Attemp an eager connection
                solWindow.solana.connect({ onlyIfTrusted: true });
            }
        }
    }, []);

    useEffect( () => {
        provider?.on("connect", (publicKey: PublicKey)=>{ 
            console.log(`connect event: ${publicKey}`);
            setConnected(true); 
            setPubKey(publicKey);
        });
        provider?.on("disconnect", ()=>{ 
            console.log("disconnect event");
            setConnected(false); 
            setPubKey(null);
        });

    }, [provider]);


    const connectHandler: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        setShowDisconnect(false)
        console.log(`connect handler`);
        provider?.connect()
        .catch((err) => { console.error("connect ERROR:", err); });
    }

    const disconnectHandler: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        console.log("disconnect handler");
        provider?.disconnect()
        .catch((err) => {console.error("disconnect ERROR:", err); });
    }

    return (
        <div className="text-white z-50">
            { walletAvail ?
                <>
                {!connected &&
                    <button disabled={connected} onClick={connectHandler} className=" bg-green-500 py-[7px] px-[20px] rounded-lg  hover:cursor-pointer hover:bg-opacity-80 w-[160px]">Connect wallet</button>}
                
                {connected ? <p onClick={()=> setShowDisconnect(true)} className=" bg-green-500 py-[7px] px-[20px] rounded-lg  hover:cursor-pointer hover:bg-opacity-80 w-[160px] overflow-ellipsis overflow-hidden">{pubKey?.toBase58()}</p> : null 
                }
                { connected && showDisconnect && <button disabled={!connected} onClick={disconnectHandler} className="absolute -bottom-[50px] bg-red-500 py-[7px] px-[20px] rounded-lg  hover:cursor-pointer hover:bg-opacity-80 w-[160px]">Disconnect</button>}
                </>
            :
                <>
                
                <p>Opps!!! Phantom is not available. Go get it <a href="https://phantom.app/">https://phantom.app/</a>.</p>
                </>
            }
        </div>
    );
}

export default Connect2Phantom;