"use client";

import { AnchorProvider, BN, Idl, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
// import { Features, features } from "./Features";
import React, { useState } from "react";
import * as splToken from "@solana/spl-token";

import idl from "@/programs/idl.json";
import { MOMO_ADDR, STAKING_ADDR } from "@/programs";
import * as anchor from "@coral-xyz/anchor";
import * as borsh from "@coral-xyz/borsh";

const UserStakingInfoLayout = borsh.struct([
  borsh.array(borsh.u64(), 2, "amount"),
  borsh.array(borsh.u64(), 2, "staked_time"),
  borsh.array(borsh.u64(), 2, "claimed_time"),
  borsh.array(borsh.u64(), 2, "claimed_amount"),
]);

interface StakingCardProps {
  id: number;
  apy: number;
  period: number;
}

const StakingCard: React.FC<StakingCardProps> = ({ id, apy, period }) => {
  const [amount, setAmount] = useState("0");
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { data } = useQuery({
    queryKey: ["staking", id, wallet],
    queryFn: async () => {
      if (!wallet) return { balance: "0" };
      // const program = new Program(idl as Idl, STAKING_ADDR);
      const walletATA = await splToken.getAssociatedTokenAddress(
        MOMO_ADDR,
        wallet.publicKey
      );
      console.log(walletATA.toString());

      const walletTokenData = await connection.getTokenAccountBalance(
        walletATA
      );

      const [userStakeInfo] = await anchor.web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("user_stake_info"),
          wallet.publicKey.toBuffer(),
        ],
        STAKING_ADDR
      );
      const userStakeInfoData = await connection.getAccountInfo(userStakeInfo);

      let staked = "0",
        reward = "0";
      if ((userStakeInfoData?.data?.length ?? 0) > 0) {
        const decodedUserStakeInfo = UserStakingInfoLayout.decode(
          userStakeInfoData?.data?.slice(8)
        );
        staked =
          decodedUserStakeInfo.amount[id - 1]
            .div(new BN("1000000"))
            .toString() ?? "0";
        const reward_period = new BN(Math.floor(Date.now() / 1000)).sub(
          decodedUserStakeInfo.claimed_time[id - 1]
        );
        reward =
          decodedUserStakeInfo.amount[id - 1]
            .mul(reward_period)
            .mul(new BN(apy / 100))
            .div(new BN(period * 60))
            .div(new BN("1000000"))
            .toString() ?? "0";
      }

      return {
        balance: walletTokenData.value.uiAmountString ?? "0",
        staked,
        reward,
      };
    },
    refetchInterval: 5000,
    enabled: Boolean(wallet),
  });

  const onStake = async () => {
    try {
      if (!wallet) {
        console.log("Connect your wallet");
        return;
      }
      if (
        !amount ||
        parseFloat(amount) <= 0 ||
        parseFloat(amount) > parseFloat(data?.balance ?? "0")
      ) {
        console.log("Invalid amount");
        return;
      }
      const parsedAmount = new anchor.BN(amount).mul(new BN("1000000"));
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program(idl as Idl, STAKING_ADDR, provider);

      const walletATA = await splToken.getAssociatedTokenAddress(
        MOMO_ADDR,
        wallet.publicKey
      );
      const [stakingInfo] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode("staking_info")],
        STAKING_ADDR
      );
      const [tokenVaults] = await anchor.web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("staking_token_vaults"),
          MOMO_ADDR.toBuffer(),
        ],
        STAKING_ADDR
      );
      const [userStakeInfo] = await anchor.web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("user_stake_info"),
          wallet.publicKey.toBuffer(),
        ],
        STAKING_ADDR
      );

      const tx = await program.methods
        .stake(new BN(id - 1), parsedAmount)
        .accounts({
          signer: wallet.publicKey,
          senderToken: walletATA,
          stakingInfo,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenMint: MOMO_ADDR,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          tokenVaults,
          userStakeInfo,
        })
        .rpc();

      console.log(tx);
    } catch (err) {
      console.log(err);
    }
  };

  const onUnstake = async () => {
    try {
      if (!wallet) {
        console.log("Connect your wallet");
        return;
      }

      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program(idl as Idl, STAKING_ADDR, provider);

      const walletATA = await splToken.getAssociatedTokenAddress(
        MOMO_ADDR,
        wallet.publicKey
      );
      const [stakingInfo] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode("staking_info")],
        STAKING_ADDR
      );
      const [tokenVaults] = await anchor.web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("staking_token_vaults"),
          MOMO_ADDR.toBuffer(),
        ],
        STAKING_ADDR
      );
      console.log(tokenVaults.toString());
      const [userStakeInfo] = await anchor.web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("user_stake_info"),
          wallet.publicKey.toBuffer(),
        ],
        STAKING_ADDR
      );

      const tx = await program.methods
        .unstake(new BN(id - 1))
        .accounts({
          signer: wallet.publicKey,
          stakingInfo,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenMint: MOMO_ADDR,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          tokenVaults,
          userStakeInfo,
          recipientToken: walletATA,
        })
        .rpc();

      console.log(tx);
    } catch (err) {
      console.log(err);
    }
  };

  const onClaim = async () => {
    try {
      if (!wallet) {
        console.log("Connect your wallet");
        return;
      }

      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program(idl as Idl, STAKING_ADDR, provider);

      const walletATA = await splToken.getAssociatedTokenAddress(
        MOMO_ADDR,
        wallet.publicKey
      );
      const [stakingInfo] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode("staking_info")],
        STAKING_ADDR
      );
      const [tokenVaults] = await anchor.web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("staking_token_vaults"),
          MOMO_ADDR.toBuffer(),
        ],
        STAKING_ADDR
      );
      const [userStakeInfo] = await anchor.web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("user_stake_info"),
          wallet.publicKey.toBuffer(),
        ],
        STAKING_ADDR
      );

      const tx = await program.methods
        .claim(new BN(id - 1))
        .accounts({
          signer: wallet.publicKey,
          stakingInfo,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenMint: MOMO_ADDR,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          tokenVaults,
          userStakeInfo,
          recipientToken: walletATA,
        })
        .rpc();

      console.log(tx);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] w-full h-full items-center   text-white">
      {/* <a href="/hi">afdafdaf</a> */}
      <div className="mx-auto bg-[#232325] bg-opacity-10 backdrop-blur-lg max-w-[650px] p-[20px] rounded-lg relative border-[1px] border-gray-600">
        <div className="flex relative">
          <img
            className="absolute right-0 -top-[60px]"
            src="/images/icon/staking-icons.svg"
            width={100}
          ></img>
          <div className="text-[30px] text-green-500 font-bold py-[10px] ">
            Staking {id}
          </div>
        </div>

        <div className="bg-[#0c0c0c] bg-opacity-60 px-[20px] rounded-t-lg my-[5px] border-l-2 border-green-500">
          <div className="flex py-[10px]">
            <div className="w-1/2">APY:</div>
            <div className="w-1/2">
              <div className="float-right">{apy}%</div>
            </div>
          </div>
          <div className="flex py-[10px]">
            <div className="w-1/2">Earn:</div>
            <div className="w-1/2">
              <div className="float-right">MONO</div>
            </div>
          </div>
          <div className="flex py-[10px]">
            <div className="w-1/2">Lock Period:</div>
            <div className="w-1/2">
              <div className="float-right">{period} Mins</div>
            </div>
          </div>
        </div>
        <div className="bg-[#0c0c0c] bg-opacity-60 px-[20px] my-[5px] border-l-2 border-green-500">
          <div className="flex pt-[20px] pb-[5px]">
            <div className="w-1/2">
              <div className="text-[12px] text-gray-400">MOMO STAKED:</div>
              <div className="text-[20px] font-bold">{data?.staked ?? "0"}</div>
            </div>
            <div className="w-1/2">
              <div className="float-right">
                <div
                  onClick={onUnstake}
                  className=" bg-green-500 p-[10px] w-[120px] text-center font-bold rounded-t-lg hover:cursor-pointer hover:bg-opacity-80"
                >
                  UNSTAKE
                </div>
              </div>
            </div>
          </div>
          <hr className=" opacity-10"></hr>
          <div className="flex pb-[10px] pt-[5px]">
            <div className="w-1/2">
              <div className="text-[12px] text-gray-400">MOMO EARNED:</div>
              <div className="text-[20px] font-bold">{data?.reward ?? "0"}</div>
            </div>
            <div className="w-1/2">
              <div className="float-right">
                <div
                  onClick={onClaim}
                  className=" bg-green-500 p-[10px] w-[120px] text-center font-bold rounded-b-lg hover:cursor-pointer hover:bg-opacity-80"
                >
                  CLAIM
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#0c0c0c] bg-opacity-60 px-[20px] my-[5px] py-[10px] rounded-b-lg border-l-2 border-green-500">
          <div className="flex text-[12px]">
            <div className="text-gray-400">Balance:</div>
            <div className="">{data?.balance ?? "0"}</div>
            <div className="text-gray-400">&nbsp; MOMO</div>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="Input Amount"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#232325] bg-opacity-60 p-[10px] my-[5px] outline-none w-full rounded-t-lg"
            ></input>
          </div>
          <div className="flex text-[12px] items-end">
            <div className="text-gray-400">You are staking &nbsp;</div>
            <div>{amount ?? "0"}</div>
            <div className="text-gray-400">&nbsp; MOMO</div>
          </div>
          <div
            className="bg-green-500 p-[10px] text-center my-[5px] rounded-b-lg font-bold hover:cursor-pointer hover:bg-opacity-80 cursor-pointer"
            onClick={onStake}
          >
            STAKE
          </div>
        </div>
        <img
          src="images/image.png "
          className="absolute lg:left-[200px] right-[70px] top-[-100px] lg:w-[200px] w-[150px]"
        ></img>
      </div>
    </div>
  );
};

export default StakingCard;
