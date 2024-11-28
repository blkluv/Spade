import csv
from datetime import datetime

from src.engine import parallel_holdem_calc, holdem_calc
from src.game.hand_analysis.winner_determiner import WinnerAnalyzer
from src.game.input import get_player_action, modify_game_settings
from src.game.resources.player import Player
from src.game.resources.poker_deck import Deck
from src.game.utils.game_utils import display_spade_art, display_new_round
from src.mediaplayer.sound_manager import play_community_card_sound


class GameRound:
    def __init__(self, players, small_blind, big_blind):
        if len(players) < 2:
            raise ValueError("Mindestens zwei Spieler sind erforderlich.")
        self.players = players
        self.deck = Deck()
        self.deck.shuffle()
        self.community_cards = []
        self.small_blind = small_blind
        self.big_blind = big_blind
        self.pot = 0
        self.current_bet = 0
        self.bets = {player.name: 0 for player in players}
        self.folded_players = set()
        self.active_players = self.players.copy()
        self.small_blind_index = 0
        self.big_blind_player = None
        self.small_blind_player = None
        self.round_logs = []  # Logs for each round
        self.exit_game = False  # Flag to indicate game exit

    # main function. One entire game round without display
    def play_round(self):
        """Plays a complete round of poker, with option to modify settings before starting."""
        display_spade_art()  # Display spade art on game start
        print("\n")

        if input("Would you like to make any changes before starting the round? (yes/no): ").lower() == 'yes':
            modify_game_settings(self)  # Use the input module's method
            if self.exit_game:
                self.save_logs()
                print("Game exited.")
                return  # Exit game if user chose to

        display_new_round()
        self.assign_blinds()
        self.deal_private_cards()
        print("---------------")
        self.calculate_probabilities()

        # Pre-Flop Betting
        self.betting_round('Pre-Flop')
        self.log_round('Pre-Flop')
        if self.declare_winner_if_only_one_remaining():
            self.reset_game()
            return
        print("---------------")
        self.calculate_probabilities()

        # Flop
        self.deal_community_cards(3)
        print("---------------")
        self.calculate_probabilities()
        self.betting_round('Flop')
        self.log_round('Flop')
        if self.declare_winner_if_only_one_remaining():
            self.reset_game()
            return

        # Turn
        self.deal_community_cards(1)
        print("---------------")
        self.calculate_probabilities()
        self.betting_round('Turn')
        self.log_round('Turn')
        if self.declare_winner_if_only_one_remaining():
            self.reset_game()
            return

        # River
        self.deal_community_cards(1)
        self.calculate_probabilities(river=True)
        print("---------------")
        self.betting_round('River')
        self.log_round('River')
        if self.declare_winner_if_only_one_remaining():
            self.reset_game()
            return

        # Showdown if more than one player remains
        self.showdown()
        self.reset_game()

    # one betting round
    def betting_round(self, round_name):
        """Executes a betting round with players matching, raising, or folding as needed."""
        print(f"\n--- {round_name.upper()} BETTING ---")

        #Dealer voice line
        play_community_card_sound(round_name)

        # Determine the starting player for the betting round
        if round_name == 'Pre-Flop':
            start_index = (self.small_blind_index + 2) % len(self.players)
        else:
            start_index = next((i for i, player in enumerate(self.players) if player not in self.folded_players),
                               0)

        player_order = self.active_players[start_index:] + self.active_players[:start_index]

        # Track which players have matched the current bet
        players_in_round = {player.name: False for player in self.active_players}
        last_raiser = None

        while not all(
                players_in_round[player.name] for player in self.active_players if player not in self.folded_players):

            for player in player_order:
                if player in self.folded_players:
                    continue  # Skip folded players

                # Skip if this is the player who last raised and everyone else has called or folded
                if last_raiser == player.name and all(
                        players_in_round[p.name] for p in self.active_players if p not in self.folded_players):
                    return  # End betting round

                to_call = self.current_bet - self.bets[player.name]

                while True:
                    action = get_player_action(player, to_call)  # TODO: AI ACTION GETTER

                    if action == 'fold':
                        player.win_prob = 0.
                        self.folded_players.add(player)
                        self.active_players.remove(player)
                        print(f"{player.name} folds.")
                        break
                    elif action == 'check':
                        call_amount = to_call
                        if call_amount == 0:
                            players_in_round[player.name] = True
                            print(f"{player.name} checks")
                            break
                        else:
                            print(f"Can't check! {player.name} has to call: {call_amount}/raise/fold!")
                            continue
                    elif action == 'call':
                        call_amount = to_call
                        if player.balance >= call_amount:
                            player.balance -= call_amount
                            self.bets[player.name] += call_amount
                            self.pot += call_amount
                            players_in_round[player.name] = True
                            print(f"{player.name} calls: {call_amount}")
                            break
                        else:
                            print(f"{player.name} does not have enough chips to call. Please choose another action.")
                            continue
                    elif action.startswith('raise'):
                        _, raise_amount = action.split()
                        raise_amount = int(raise_amount)
                        total_bet = to_call + raise_amount

                        if player.balance >= total_bet:
                            player.balance -= total_bet
                            self.bets[player.name] += total_bet
                            self.pot += total_bet
                            self.current_bet += raise_amount  # Update the highest bet
                            print(f"{player.name} raises by {raise_amount}")

                            # Update last raiser and reset players_in_round for a new round of calling
                            last_raiser = player.name
                            players_in_round = {p.name: (p in self.folded_players) for p in self.active_players}
                            players_in_round[player.name] = True  # Player who raised has already matched their own bet
                            break
                        else:
                            print(f"{player.name} does not have enough chips to raise. Please choose another action.")
                            continue

                # Break if only one active player remains
                if len([p for p in self.active_players if p not in self.folded_players]) <= 1:
                    return

    def assign_blinds(self):
        """Assigns small and big blinds to players and handles the initial bets."""
        print("\n--- BLINDS ---")
        self.small_blind_player = self.players[self.small_blind_index]
        self.big_blind_player = self.players[(self.small_blind_index + 1) % len(self.players)]

        # Deduct blinds from player balances
        if self.small_blind_player.balance >= self.small_blind:
            self.small_blind_player.balance -= self.small_blind
            self.bets[self.small_blind_player.name] += self.small_blind
            self.pot += self.small_blind
        else:
            raise ValueError(f"{self.small_blind_player.name} does not have enough chips for the small blind.")

        if self.big_blind_player.balance >= self.big_blind:
            self.big_blind_player.balance -= self.big_blind
            self.bets[self.big_blind_player.name] += self.big_blind
            self.pot += self.big_blind
            self.current_bet = self.big_blind  # Set the minimum call amount
        else:
            raise ValueError(f"{self.big_blind_player.name} does not have enough chips for the big blind.")

        print(f"{self.small_blind_player.name} posts small blind: {self.small_blind}")
        print(f"{self.big_blind_player.name} posts big blind: {self.big_blind}")

    def rotate_blinds(self):
        """Rotates blinds to the next players after each round."""
        self.small_blind_index = (self.small_blind_index + 1) % len(self.players)

    def deal_private_cards(self):
        """Deals two private cards to each player."""
        print("\n--- DEALING PRIVATE CARDS ---")
        for _ in range(2):
            for index, player in enumerate(self.players):
                card = self.deck.deal_card()
                player.receive_card(card)
                print(f"{player.name} erhält Karte: {card}")

    def deal_community_cards(self, number):
        """Deals the specified number of community cards."""
        print("\n--- DEALING COMMUNITY CARDS ---")
        for _ in range(number):
            card = self.deck.deal_card()
            self.community_cards.append(card)
            print(f"Gemeinschaftskarte: {card}")

    def showdown(self):
        """Determines the winner(s) and distributes the pot."""
        print("\n--- SHOWDOWN ---")

        if not self.active_players:
            print("Alle Spieler haben gefoldet. Pot bleibt unverteilt.")
            return

        community = self.community_cards
        player_hands = [(player, player.get_best_hand(community)) for player in self.active_players]

        analyzer = WinnerAnalyzer([(player.name, best_hand[1]) for player, best_hand in player_hands])
        winners = analyzer.analyze_winners()

        if len(winners) == 1:
            winner = winners[0]
            winning_player = next(player for player in self.players if player.name == winner[0])
            winning_player.add_balance(self.pot)
            print(f"Gewinner ist {winning_player.name} mit {winner[1]}. Pot: {self.pot}")
        else:
            winner_info = winners[0]
            split_amount = self.pot // len(winners)
            winner_names = ', '.join([winner[0] for winner in winners])
            print(
                f"Es gibt einen Split-Pot zwischen: {winner_names}. Jeder erhält: {split_amount}")
            for winner in winners:
                winning_player = next(player for player in self.players if player.name == winner[0])
                winning_player.add_balance(split_amount)

    def declare_winner_if_only_one_remaining(self):
        """Checks if only one player remains and declares them the winner."""

        if len(self.active_players) == 1:
            winner = self.active_players[0]
            winner.add_balance(self.pot)
            print(f"{winner.name} gewinnt {self.pot}, da alle anderen Spieler gefoldet haben.")
            return True
        return False

    def reset_game(self):
        """Resets the game state for the next round and rotates blinds."""
        self.deck = Deck()
        self.deck.shuffle()
        self.community_cards = []
        self.pot = 0
        self.current_bet = 0
        self.bets = {player.name: 0 for player in self.players}
        self.folded_players = set()
        self.active_players = self.players.copy()

        for player in self.players:
            player.clear_cards()

        self.rotate_blinds()  # Move blinds to the next players

    def calculate_probabilities(self, river=False):
        # Create abbreviations for community and player cards
        community_cards = [c.abbreviation for c in self.community_cards]
        player_cards = []

        # Add cards from each player to player cards
        for player in self.active_players:
            player_cards.extend([c.abbreviation for c in player.cards])

        # Use engine to calculate probs: SCHULDIG: DESHALB KACKE MIT TERMINAL OUTPUT
        # Can use parallel to be faster
        # probs = parallel_holdem_calc.calculate(community_cards, False, 10e3, None, player_cards, False)

        probs = holdem_calc.calculate(community_cards, False, 10e3, None, player_cards, False)

        # Update probs in player objects
        for i in range(len(self.active_players)):
            self.active_players[i].win_prob = probs[i + 1] * 100
            # pass

    def log_round(self, round_name):
        """Logs the current state of the game after each betting round."""
        log_entry = {
            'round': round_name,
            'pot': self.pot,
            'community_cards': [str(card) for card in self.community_cards],
            'player_bets': {player.name: self.bets[player.name] for player in self.players},
            'player_balances': {player.name: player.balance for player in self.players}
        }
        self.round_logs.append(log_entry)

    def save_logs(self):
        """Saves the game log to a CSV file upon exit."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"poker_game_log_{timestamp}.csv"
        with open(filename, 'w', newline='') as csvfile:
            fieldnames = ['round', 'pot', 'community_cards', 'player_bets', 'player_balances']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for entry in self.round_logs:
                writer.writerow({
                    'round': entry['round'],
                    'pot': entry['pot'],
                    'community_cards': ', '.join(entry['community_cards']),
                    'player_bets': ', '.join([f"{k}: {v}" for k, v in entry['player_bets'].items()]),
                    'player_balances': ', '.join([f"{k}: {v}" for k, v in entry['player_balances'].items()])
                })
        print(f"Game log saved as {filename}.")


def main():
    # Initialisiere Spieler
    player_names = ['Alice', 'Bob', 'Charlie', 'Diana']
    players = [Player(name) for name in player_names]

    # Initialisiere das Spiel
    game = GameRound(players, small_blind=10, big_blind=20)

    # Simuliere eine Pokerrunde
    game.play_round()


if __name__ == "__main__":
    main()
