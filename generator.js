// SPDX-License-Identifier: GPL-3.0
// @author: NoFaceDev

/*

WHAT IS THIS

A basic offline app which will create vanity addresses with Ledger / Metamask derivation path 
compatible seed phrases. Note that this will be incredibly slow compared to generating a 
private key. This app can be used on airgapped computers for better security.
It is better to have a random seed with a human-readable public key than the other way around.

THIS WILL BE SLOW

EthersJS is very slow at creating wallets using createRandom. This tool serves a very niche purpose
since it is not possible to create a seed phrase from a private key. If you just want one vanity
address and don't mind having a private key rather than a seed phrase, use an open source program 
on an airgapped computer as it will be a lot faster.

WHY IS THIS NEEDED

Programs for generating vanity addresses exist. In fact, I have made one in the past. The problem 
with these generators is that they provide the user with a private key rather than a mnemonic.
This program gives users a Metamask seed phrase rather than a private key. Of course, this comes 
with the downside of it being MUCH slower than a vanity address generator which uses private keys.

WHO IS THIS FOR

If you want to generate a seed phrase which is directly compatible with your Ledger or Metamask,
this is for you. If you wish to use the first address (index 0) as your vanity address but still
use other addresses derived from the same seed, this is for you. This program will not be capable 
of generating complex vanity addresses fast. 

SOME PITFALLS

> Time estimation isn't supposed to be super accurate and is really just a guide so you don't try 
and generate an address which would take years. It doesn't consider permutations/combinations so 
may overestimate time. 

*/

const { ethers } = require("ethers");

//CONFIGURATION

//NOTE: It is recommended to use a maximum of 4 characters since this program will be very slow
const stopAfterSingleMatch = false;

//What you want the start to look like. Leave empty to not check the start.
const startPattern = "1234"

//What you want the end to look like. Leave empty to not check the end.
const endPattern = ""

//A custom derivation path you need to use it
//NOTE: A custom path will slow down generation by about 50% 
const metamaskDerivationPath = "m/44'/60'/0'/0/0"
const derivationPath = metamaskDerivationPath //PUT YOURS HERE


//SEARCH ESTIMATES

let requiredWallets = 1;
if (startPattern.length > 0) {
    requiredWallets *= Math.pow(16, startPattern.length)
}
if (endPattern.length > 0) {
    requiredWallets *= Math.pow(16, endPattern.length)
}
console.log(`You may  need to go through ${requiredWallets} wallets (ignoring checksums) before you find your combination.`)
console.log("Performing speed benchmark using 1000 wallets...")

// Variables

const startTime = Math.floor(new Date().getTime() / 1000);
let currentTime = Math.floor(new Date().getTime() / 1000);

let isMatchFound = false; //Have we found a matching wallet
let isMatching = true; //Does the current wallet match
let searchCount = 0; //How many wallets we have searched through so far

let timeRemaining = 0; //Time remaining in minutes
let timePerThousand = 0; //Time it takes to generate 1000 wallets
let matchingIterator = 0; //Iterator for comparing addresses to what we want
let walletInstance = undefined; //Variable for storing wallet instances
let seedInstance = undefined //Variable for storing wallet instances we use for their mnemonic only 


while (true) {

    matchingIterator = 0;
    isMatching = true;
    searchCount++;

    // Handle custom derivation path wallet generation 
    if (derivationPath !== metamaskDerivationPath) {
        //Ethers does not have a way to override the default path for createRandom
        seedInstance = ethers.Wallet.createRandom(derivationPath);
        walletInstance = ethers.Wallet.fromMnemonic(seedInstance.mnemonic.phrase, path = derivationPath)
    } else {
        walletInstance = ethers.Wallet.createRandom(derivationPath);
    }

    // Speed benchmark
    if (searchCount === 1000) {
        console.log("Completed speed benchmark:")
        currentTime = (Math.floor(new Date().getTime()) / 1000).toFixed(2);
        //Search time remaining in seconds
        timeRemaining = (currentTime - startTime) * (requiredWallets / (1000))
        //Convert this to minutes
        timeRemaining = timeRemaining / 60
        timeRemaining = timeRemaining.toFixed(2);
        //Calculate time to generate 1000 wallets (in seconds)
        timePerThousand = (currentTime - startTime)
        //Calculate wallets per second
        const walletsPerSecond = (1000 / timePerThousand)
        console.log(`Your computer is capable of generating ${walletsPerSecond} wallets per second.`)
        //Tell user time remaining estimate
        console.log(`Maximum  ${timeRemaining} minutes left...`)
    }

    // Progress messages every 1000 wallets
    if (searchCount % 1000 === 0) {
        console.log(`Searched ${searchCount} wallets so far...`)
        //Update time remaining
        currentTime = Math.floor(new Date().getTime() / (1000));
        timeRemaining -= (timePerThousand / 60)
        timeRemaining = timeRemaining.toFixed(2)
        console.log(`Maximum ${timeRemaining} minutes left...`)
    }


    //Indices 0 and 1 will always be 0x because of how EthersJS stores wallet addresses
    while (startPattern[matchingIterator] !== undefined) {
        //If there is a mismatch, break and continue. Starting from the first characters.
        if (walletInstance.address[matchingIterator + 2].toLowerCase() !== startPattern[matchingIterator].toLowerCase()) {
            isMatching = false;
            break;
        }
        matchingIterator++;
    }

    //Don't bother checking the end if the start doesn't match
    if (!isMatching) continue;

    matchingIterator = 0;
    while (endPattern[matchingIterator] !== undefined) {
        //If there is a mismatch, break and continue. Starting from the last characters.
        if (walletInstance.address[41 - matchingIterator].toLowerCase() !== endPattern[matchingIterator].toLowerCase()) {
            isMatching = false;
            break;
        }
        matchingIterator++;
    }

    //When there is a match, print it to the console and give some information about the wallet.
    if (isMatching) {
        isMatchFound = true;
        console.log(`Generated ${searchCount} wallets to find the output you wanted.`)
        console.log(walletInstance.address)
        console.log(walletInstance.mnemonic)
        if(stopAfterSingleMatch) break;
    }

}

