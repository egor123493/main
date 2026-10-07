import math
import unittest

def area(r):
    '''
    Возвращает площадь круга.

    Параметры:
        r (float): радиус круга

    Возвращаемое значение:
        float: площадь круга (π * r²)

    Пример вызова:
        area(2)  # 12.566370614359172
    '''
    return math.pi * r * r


def perimeter(r):
    '''
    Возвращает длину окружности.

    Параметры:
        r (float): радиус круга

    Возвращаемое значение:
        float: длина окружности (2 * π * r)

    Пример вызова:
        perimeter(2)  # 12.566370614359172
    '''
    return 2 * math.pi * r
class CircleTestCase(unittest.TestCase):
   def test_zero_mul(self):
       res = area(2)
       self.assertAlmostEqual(res, 12.566370614359172)
       
   def test_square_mul(self):
       res = perimeter(2)
       self.assertAlmostEqual(res, 12.566370614359172)