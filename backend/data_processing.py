from typing import Tuple, Sequence
import pandas as pd
import numpy as np

def split_csv_to_np_arrays(
    csv_path: str,
    feature_indices: Sequence[int],
    train_frac: float = 0.70,
    val_frac: float = 0.15,
    test_frac: float = 0.15,
    shuffle: bool = True,
    random_state: int = 42
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Împarte un CSV în trei numpy.ndarray (xtrain, yvalidate, ztest),
    folosind DOAR coloanele indicate prin indici (0-based).

    Args:
        csv_path: calea către fișierul CSV.
        feature_indices: lista de indici de coloane (0-based) care vor fi incluse.
        train_frac, val_frac, test_frac: proporții care trebuie să însumeze 1.0.
        shuffle: dacă să amestece rândurile înainte de split.
        random_state: seed pentru reproducibilitate.

    Returnează:
        xtrain, yvalidate, ztest ca np.ndarray.
    """
    if not np.isclose(train_frac + val_frac + test_frac, 1.0):
        raise ValueError("Proporțiile trebuie să însumeze 1.0 (ex: 0.70, 0.15, 0.15).")

    if not feature_indices:
        raise ValueError("feature_indices nu poate fi gol.")

    # Citește CSV
    df = pd.read_csv(csv_path, sep='|')

    # Validare indici (0-based)
    n_cols = df.shape[1]
    bad = [i for i in feature_indices if i < 0 or i >= n_cols]
    if bad:
        raise IndexError(f"Indici invalizi pentru coloane: {bad}. CSV are {n_cols} coloane (0..{n_cols-1}).")

    # Păstrează doar coloanele cerute, în ordinea primită
    df = df.iloc[:, list(feature_indices)]

    # Shuffle (opțional)
    if shuffle:
        df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)

    # Split 70/15/15
    n = len(df)
    n_train = int(n * train_frac)
    n_val = int(n * val_frac)
    # restul merge la test ca să acoperim rotunjirile
    n_test = n - n_train - n_val

    xtrain = df.iloc[:n_train].to_numpy()
    yvalidate = df.iloc[n_train:n_train + n_val].to_numpy()
    ztest = df.iloc[n_train + n_val:].to_numpy()

    return xtrain, yvalidate, ztest