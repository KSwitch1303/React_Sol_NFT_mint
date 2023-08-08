import React, { useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton } from '@solana/wallet-adapter-react-ui';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import anchor from '@project-serum/anchor';

const network = clusterApiUrl('devnet'); // Use devnet for testing

async function createAssociatedTokenAccount(payer, mintAddress) {
  const token = new anchor.web3.PublicKey(TOKEN_PROGRAM_ID);
  const associatedTokenAddress = await anchor.web3.PublicKey.findProgramAddress(
    [payer.toBuffer(), token.toBuffer(), mintAddress.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const ix = anchor.web3.SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: associatedTokenAddress[0],
    space: 165,
    lamports: await provider.connection.getMinimumBalanceForRentExemption(165, 'singleGossip'),
    programId: token,
  });
  return [ix, associatedTokenAddress[0]];
}

async function mintNFT(payer, mint, metadata) {
  const token = new anchor.Program(TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, payer);
  const nftTokenAccount = await token.createAccount(mint.publicKey);
  await token.mintTo(nftTokenAccount, mint, [], 1);
  await token.setAuthority(mint.publicKey, null, 'MintTokens', payer, []);
  return nftTokenAccount;
}

function App() {
  const wallet = useWallet();
  const [mintAddress, setMintAddress] = useState('');

  useEffect(() => {
    const connection = new Connection(network, 'confirmed');

    async function createNFT() {
      if (!wallet.connected || !wallet.publicKey) return;
      
      anchor.setProvider(wallet.connection);

      const mint = await createNFTMint(wallet.publicKey);
      setMintAddress(mint.publicKey.toBase58());

      const metadata = {
        name: 'My NFT',
        symbol: 'NFT',
        uri: 'https://example.com/nft-metadata',
      };

      await mintNFT(wallet, mint, metadata);
    }

    createNFT();
  }, [wallet]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Solana NFT Minting</h1>
        <p>Minted NFT Mint Address: {mintAddress}</p>
        <WalletProvider wallets={[]}>
          <WalletConnectButton />
        </WalletProvider>
      </header>
    </div>
  );
}

export default App;
