import { createPublicClient, createWalletClient, http, keccak256, stringToHex, parseAbi } from 'viem';
import { foundry } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';

// Load the ABI from the deployed contract
const CONTRACT_ABI = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../../abi/TournamentScores.json'),
    'utf8'
  )
).abi;

export interface TournamentConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
  chainId: number;
}

export interface TournamentData {
  id: number;
  name: string;
  game_id: number;
  max_players: number;
  min_players: number;
  tournament_type: 'single_elimination' | 'double_elimination';
  status: 'registration' | 'in_progress' | 'completed' | 'cancelled';
  winner_id: number | null;
  winner_alias: string | null;
  created_by: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  settings: string | null;
  blockchain_tournament_id: string | null;
  blockchain_transaction_hash: string | null;
  blockchain_enabled: boolean;
}

export interface TournamentPlayer {
  id: number;
  tournament_id: number;
  user_id: number | null;
  alias: string;
  seed: number | null;
  eliminated: boolean;
  final_position: number | null;
  registered_at: string;
}

export interface BlockchainScore {
  nicknameHash: `0x${string}`;
  score: number;
}

export interface TournamentLeaderboard extends BlockchainScore {
  alias: string;
  rank: number;
}

export interface TournamentWithLeaderboard extends TournamentData {
  leaderboard: TournamentLeaderboard[];
  total_players: number;
  blockchain_entry_count: number;
  blockchain_verified: boolean;
}

export class TournamentProvider {
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private contractAddress: `0x${string}` | null = null;
  private abi: any[];

  constructor(config: TournamentConfig) {
    this.abi = CONTRACT_ABI;

    // Initialize public client for read operations
    this.publicClient = createPublicClient({
      chain: config.chainId === 31337 ? foundry : {
        id: config.chainId,
        name: config.chainId === 43113 ? 'Avalanche Fuji' : 'Unknown',
        nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
        rpcUrls: {
          default: { http: [config.rpcUrl] },
          public: { http: [config.rpcUrl] },
        },
      },
      transport: http(config.rpcUrl),
    });

    // Initialize wallet client for write operations
    if (config.privateKey && config.contractAddress) {
      const privateKey = config.privateKey.startsWith('0x') ?
        config.privateKey as `0x${string}` :
        `0x${config.privateKey}`;

      const account = privateKeyToAccount(privateKey as `0x${string}`);

      this.walletClient = createWalletClient({
        chain: this.publicClient.chain,
        transport: http(config.rpcUrl),
        account: account,
      });

      this.contractAddress = config.contractAddress.startsWith('0x') ?
        config.contractAddress as `0x${string}` :
        `0x${config.contractAddress}` as `0x${string}`;
    }
  }

  /**
   * Generate tournament ID from tournament name (used on blockchain)
   */
  generateTournamentId(tournamentName: string): `0x${string}` {
    return keccak256(stringToHex(tournamentName.toLowerCase().trim()));
  }

  /**
   * Generate nickname hash from player nickname (used on blockchain)
   */
  generateNicknameHash(nickname: string): `0x${string}` {
    return keccak256(stringToHex(nickname.toLowerCase().trim()));
  }

  /**
   * Create a tournament on the blockchain
   */
  async createTournament(tournamentName: string): Promise<{
    success: boolean;
    error?: string;
    transactionHash?: string;
    tournamentId?: string;
  }> {
    if (!this.walletClient || !this.contractAddress) {
      return {
        success: false,
        error: 'Wallet client or contract address not configured'
      };
    }

    try {
      const tournamentId = this.generateTournamentId(tournamentName);

      // Check if tournament already exists
      const exists = await this.tournamentExists(tournamentId);
      if (exists) {
        return {
          success: false,
          error: 'Tournament already exists on blockchain'
        };
      }

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress!,
        abi: this.abi,
        functionName: 'createTournament',
        args: [tournamentId],
        chain: this.publicClient.chain,
        account: this.walletClient.account || null,
      });

      return {
        success: true,
        transactionHash: hash,
        tournamentId,
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
   * Submit a score to the blockchain
   */
  async submitScore(
    tournamentName: string,
    playerAlias: string,
    score: number
  ): Promise<{
    success: boolean;
    error?: string;
    transactionHash?: string;
  }> {
    if (!this.walletClient || !this.contractAddress) {
      return {
        success: false,
        error: 'Wallet client or contract address not configured'
      };
    }

    try {
      const tournamentId = this.generateTournamentId(tournamentName);
      const nicknameHash = this.generateNicknameHash(playerAlias);

      // Ensure score fits in uint32
      const normalizedScore = Math.max(0, Math.min(Math.floor(score), 4294967295));

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress!,
        abi: this.abi,
        functionName: 'submitScore',
        args: [tournamentId, nicknameHash, normalizedScore],
        chain: this.publicClient.chain,
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
        address: this.contractAddress!,
        abi: this.abi,
        functionName: 'tournamentExists',
        args: [tournamentId],
      });
      return Boolean(exists);
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
        abi: this.abi,
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
  ): Promise<BlockchainScore[]> {
    if (!this.contractAddress) {
      return [];
    }

    try {
      const tournamentId = this.generateTournamentId(tournamentName);
      const entries = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.abi,
        functionName: 'getTournamentEntries',
        args: [tournamentId, BigInt(start), BigInt(count)],
      });
      return entries as BlockchainScore[];
    } catch (error) {
      console.error('Error getting tournament entries:', error);
      return [];
    }
  }

  /**
   * Get complete tournament leaderboard with alias resolution
   */
  async getLeaderboard(
    tournament: TournamentData,
    registrations: TournamentPlayer[]
  ): Promise<TournamentWithLeaderboard> {
    try {
      // Check if tournament exists on blockchain
      const exists = await this.tournamentExists(tournament.name);

      if (!exists) {
        return {
          ...tournament,
          leaderboard: [],
          total_players: registrations.length,
          blockchain_entry_count: 0,
          blockchain_verified: false,
        };
      }

      // Get all entries from blockchain
      const entryCount = await this.getEntryCount(tournament.name);

      if (entryCount === 0) {
        return {
          ...tournament,
          leaderboard: [],
          total_players: registrations.length,
          blockchain_entry_count: 0,
          blockchain_verified: true,
        };
      }

      // Get all entries from blockchain
      const blockchainEntries = await this.getTournamentEntries(
        tournament.name,
        0,
        entryCount
      );

      // Create hash-to-alias mapping from registrations
      const hashToAlias = new Map<string, string>();
      for (const registration of registrations) {
        const hash = this.generateNicknameHash(registration.alias);
        hashToAlias.set(hash, registration.alias);
      }

      // Convert blockchain entries to readable format with aliases and ranking
      const leaderboard: TournamentLeaderboard[] = blockchainEntries
        .map((entry, index) => ({
          alias: hashToAlias.get(entry.nicknameHash) ||
                entry.nicknameHash.slice(0, 8) + '...', // Fallback for unknown aliases
          score: entry.score,
          nicknameHash: entry.nicknameHash,
          rank: undefined, // Will be assigned after sorting
        }))
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .map((entry, index) => ({
          ...entry,
          rank: index + 1, // Assign rank starting from 1
        }));

      return {
        ...tournament,
        leaderboard,
        total_players: registrations.length,
        blockchain_entry_count: entryCount,
        blockchain_verified: true,
      };
    } catch (error) {
      console.error('Error getting leaderboard from blockchain:', error);
      return {
        ...tournament,
        leaderboard: [],
        total_players: registrations.length,
        blockchain_entry_count: 0,
        blockchain_verified: false,
      };
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
        address: this.contractAddress!,
        abi: this.abi,
        functionName: 'owner',
        args: [],
      });
      return String(owner);
    } catch (error) {
      console.error('Error getting contract owner:', error);
      return null;
    }
  }

  /**
   * Check health of the provider and blockchain connection
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    contractAddress?: string;
    owner?: string;
    blockNumber?: bigint;
    error?: string;
  }> {
    try {
      if (!this.contractAddress) {
        return {
          healthy: false,
          error: 'Contract address not configured'
        };
      }

      // Test basic blockchain connectivity
      const blockNumber = await this.publicClient.getBlockNumber();

      // Test contract exists
      const code = await this.publicClient.getBytecode({
        address: this.contractAddress,
      });

      if (!code) {
        return {
          healthy: false,
          contractAddress: this.contractAddress,
          blockNumber,
          error: 'Contract not found at specified address',
        };
      }

      // Get contract owner
      const owner = await this.getContractOwner();

      return {
        healthy: true,
        contractAddress: this.contractAddress,
        owner: owner || undefined,
        blockNumber,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify tournament integrity - compare local vs blockchain data
   */
  async verifyTournamentIntegrity(
    tournament: TournamentData,
    registrations: TournamentPlayer[]
  ): Promise<{
      verified: boolean;
      issues: string[];
      blockchainEntries: number;
      localPlayers: number;
    }> {
    const issues: string[] = [];
    let blockchainEntries = 0;

    try {
      // Check if tournament exists on blockchain
      const exists = await this.tournamentExists(tournament.name);
      if (!exists) {
        issues.push('Tournament does not exist on blockchain');
        return {
          verified: false,
          issues,
          blockchainEntries: 0,
          localPlayers: registrations.length,
        };
      }

      // Get blockchain entry count
      blockchainEntries = await this.getEntryCount(tournament.name);

      // Get blockchain entries
      const entries = await this.getTournamentEntries(
        tournament.name,
        0,
        blockchainEntries
      );

      // Check for duplicate submissions
      const nicknameHashes = new Set<string>();
      for (const entry of entries) {
        if (nicknameHashes.has(entry.nicknameHash)) {
          issues.push(`Duplicate nickname hash found: ${entry.nicknameHash}`);
        }
        nicknameHashes.add(entry.nicknameHash);
      }

      // Check if all local players have corresponding blockchain entries
      const localNicknameHashes = new Set(
        registrations.map(r => this.generateNicknameHash(r.alias))
      );

      for (const hash of localNicknameHashes) {
        if (!nicknameHashes.has(hash)) {
          issues.push(`Local player alias not found in blockchain: ${hash}`);
        }
      }

      return {
        verified: issues.length === 0,
        issues,
        blockchainEntries,
        localPlayers: registrations.length,
      };
    } catch (error) {
      issues.push(`Error during verification: ${error instanceof Error ? error.message : String(error)}`);
      return {
        verified: false,
        issues,
        blockchainEntries,
        localPlayers: registrations.length,
      };
    }
  }

  /**
   * Get tournament statistics from blockchain
   */
  async getBlockchainStats(tournamentName: string): Promise<{
    exists: boolean;
    entryCount: number;
    entries: BlockchainScore[];
    owner?: string;
  }> {
    try {
      const exists = await this.tournamentExists(tournamentName);

      if (!exists) {
        return { exists: false, entryCount: 0, entries: [] };
      }

      const entryCount = await this.getEntryCount(tournamentName);
      const entries = await this.getTournamentEntries(tournamentName, 0, entryCount);
      const owner = await this.getContractOwner();

      return {
        exists: true,
        entryCount,
        entries,
        owner: owner || undefined,
      };
    } catch (error) {
      console.error('Error getting blockchain stats:', error);
      return { exists: false, entryCount: 0, entries: [] };
    }
  }
}

// Singleton instance for application-wide use
let tournamentProvider: TournamentProvider | null = null;

export function getTournamentProvider(): TournamentProvider {
  if (!tournamentProvider) {
    const config: TournamentConfig = {
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
      contractAddress: process.env.TOURNAMENT_SCORES_CONTRACT_ADDRESS || '',
      chainId: parseInt(process.env.CHAIN_ID || '31337'),
    };

    tournamentProvider = new TournamentProvider(config);
  }

  return tournamentProvider;
}

export function initializeTournamentProvider(config: TournamentConfig): void {
  tournamentProvider = new TournamentProvider(config);
}