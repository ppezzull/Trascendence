import { createPublicClient, createWalletClient, http, parseAbi, keccak256, stringToHex } from 'viem';
import { foundry } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Contract ABI from TournamentScores.json
const TOURNAMENT_SCORES_ABI = [
  {
    "inputs": [{"internalType": "bytes32", "name": "tournamentId", "type": "bytes32"}],
    "name": "createTournament",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "tournamentId", "type": "bytes32"},
      {"internalType": "bytes32", "name": "nicknameHash", "type": "bytes32"},
      {"internalType": "uint32", "name": "score", "type": "uint32"}
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "tournamentId", "type": "bytes32"}],
    "name": "getEntryCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "tournamentId", "type": "bytes32"},
      {"internalType": "uint256", "name": "start", "type": "uint256"},
      {"internalType": "uint256", "name": "count", "type": "uint256"}
    ],
    "name": "getTournamentEntries",
    "outputs": [
      {
        "components": [
          {"internalType": "bytes32", "name": "nicknameHash", "type": "bytes32"},
          {"internalType": "uint32", "name": "score", "type": "uint32"}
        ],
        "internalType": "struct TournamentScores.Entry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "tournamentId", "type": "bytes32"}],
    "name": "tournamentExists",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export interface BlockchainConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
  chainId: number;
}

export interface TournamentEntry {
  nicknameHash: `0x${string}`;
  score: number;
}

export class BlockchainService {
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private contractAddress: `0x${string}` | null = null;
  private config: BlockchainConfig;

  constructor(config: BlockchainConfig) {
    this.config = config;

    // Initialize public client for read operations
    this.publicClient = createPublicClient({
      chain: {
        id: config.chainId,
        name: config.chainId === 31337 ? 'Foundry' : 'Avalanche Fuji',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: [config.rpcUrl] },
          public: { http: [config.rpcUrl] },
        },
      },
      transport: http(config.rpcUrl),
    });

    // Initialize wallet client for write operations (if private key provided)
    if (config.privateKey && config.contractAddress) {
      // Ensure private key format is correct
      const privateKey = config.privateKey.startsWith('0x') ? config.privateKey as `0x${string}` : `0x${config.privateKey}`;

      // Ensure contract address format is correct
      const contractAddress = config.contractAddress.startsWith('0x') ? config.contractAddress : `0x${config.contractAddress}`;

      const account = privateKeyToAccount(privateKey as `0x${string}`);

      this.walletClient = createWalletClient({
        chain: this.publicClient.chain,
        transport: http(config.rpcUrl),
        account: account,
      });
      this.contractAddress = contractAddress as `0x${string}`;
    }
  }

  /**
   * Generate tournament ID from tournament name
   */
  generateTournamentId(tournamentName: string): `0x${string}` {
    return keccak256(stringToHex(tournamentName.toLowerCase().trim()));
  }

  /**
   * Generate nickname hash from player nickname
   */
  generateNicknameHash(nickname: string): `0x${string}` {
    return keccak256(stringToHex(nickname.toLowerCase().trim()));
  }

  /**
   * Create a tournament on the blockchain
   */
  async createTournament(tournamentName: string): Promise<{ success: boolean; error?: string; transactionHash?: string }> {
    if (!this.walletClient || !this.contractAddress) {
      return { success: false, error: 'Wallet client not initialized' };
    }

    try {
      const tournamentId = this.generateTournamentId(tournamentName);

      // Check if tournament already exists
      const exists = await this.tournamentExists(tournamentId);
      if (exists) {
        return { success: false, error: 'Tournament already exists on blockchain' };
      }

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: TOURNAMENT_SCORES_ABI,
        functionName: 'createTournament',
        args: [tournamentId],
        chain: this.walletClient.chain,
        account: this.walletClient.account || null,
      });

      return {
        success: true,
        transactionHash: hash
      };
    } catch (error) {
      console.error('Error creating tournament on blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit a score to the blockchain tournament
   */
  async submitScore(
    tournamentName: string,
    nickname: string,
    score: number
  ): Promise<{ success: boolean; error?: string; transactionHash?: string }> {
    if (!this.walletClient || !this.contractAddress) {
      return { success: false, error: 'Wallet client not initialized' };
    }

    try {
      const tournamentId = this.generateTournamentId(tournamentName);
      const nicknameHash = this.generateNicknameHash(nickname);

      // Ensure score fits in uint32
      const normalizedScore = Math.max(0, Math.min(Math.floor(score), 4294967295));

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: TOURNAMENT_SCORES_ABI,
        functionName: 'submitScore',
        args: [tournamentId, nicknameHash, normalizedScore],
        chain: this.walletClient.chain,
        account: this.walletClient.account || null,
      });

      return {
        success: true,
        transactionHash: hash
      };
    } catch (error) {
      console.error('Error submitting score to blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a tournament exists on the blockchain
   */
  async tournamentExists(tournamentName: string): Promise<boolean> {
    if (!this.contractAddress) {
      return false;
    }

    try {
      const tournamentId = this.generateTournamentId(tournamentName);
      const exists = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: TOURNAMENT_SCORES_ABI,
        functionName: 'tournamentExists',
        args: [tournamentId],
      });
      return exists as boolean;
    } catch (error) {
      console.error('Error checking tournament existence:', error);
      return false;
    }
  }

  /**
   * Get the number of entries in a tournament
   */
  async getEntryCount(tournamentName: string): Promise<number> {
    if (!this.contractAddress) {
      return 0;
    }

    try {
      const tournamentId = this.generateTournamentId(tournamentName);
      const count = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: TOURNAMENT_SCORES_ABI,
        functionName: 'getEntryCount',
        args: [tournamentId],
      });
      return Number(count);
    } catch (error) {
      console.error('Error getting entry count:', error);
      return 0;
    }
  }

  /**
   * Get tournament entries from blockchain (paginated)
   */
  async getTournamentEntries(
    tournamentName: string,
    start: number = 0,
    count: number = 50
  ): Promise<TournamentEntry[]> {
    if (!this.contractAddress) {
      return [];
    }

    try {
      const tournamentId = this.generateTournamentId(tournamentName);
      const entries = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: TOURNAMENT_SCORES_ABI,
        functionName: 'getTournamentEntries',
        args: [tournamentId, BigInt(start), BigInt(count)],
      });
      return entries as TournamentEntry[];
    } catch (error) {
      console.error('Error getting tournament entries:', error);
      return [];
    }
  }

  /**
   * Get contract owner
   */
  async getContractOwner(): Promise<string | null> {
    if (!this.contractAddress) {
      return null;
    }

    try {
      const owner = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: TOURNAMENT_SCORES_ABI,
        functionName: 'owner',
      });
      return owner as string;
    } catch (error) {
      console.error('Error getting contract owner:', error);
      return null;
    }
  }

  /**
   * Check if service is properly configured and connected
   */
  async isHealthy(): Promise<{ healthy: boolean; contractAddress?: string; owner?: string }> {
    try {
      if (!this.contractAddress) {
        return { healthy: false };
      }

      const owner = await this.getContractOwner();
      return {
        healthy: !!owner,
        contractAddress: this.contractAddress,
        owner: owner || undefined
      };
    } catch (error) {
      return { healthy: false };
    }
  }
}

// Singleton instance for the application
let blockchainService: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
  if (!blockchainService) {
    const config: BlockchainConfig = {
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
      contractAddress: process.env.TOURNAMENT_SCORES_CONTRACT_ADDRESS || '',
      chainId: parseInt(process.env.CHAIN_ID || '31337'),
    };

    blockchainService = new BlockchainService(config);
  }

  return blockchainService;
}

export function initializeBlockchainService(config: BlockchainConfig): void {
  blockchainService = new BlockchainService(config);
}