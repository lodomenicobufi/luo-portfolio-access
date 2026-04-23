// src/app/components/login/login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const LOGO_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAmUklEQVR4nO3de5gcVZ038O/vnKrqy9ySSTIJQgQEAySIQAhEktAzAbzkIWJgu1eSqCvqg8K6UVzWy+trT6Owy6IoL4uaFQEXeJRpXBUQAyHOdCQQhIhKEiAhQCQJYXKbSaZvVXXO7/2jq5MhmVtgZnpmPJ/n4clDUl11qvv86txPAYZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGP2gSicgMJB08JCnwjAOU/EAISIIIcDce/4nImit+zzGMIaCVakLx+NxmU6nVVNT02c8z7vG8zwFQPZwqLIsS1ZXV9+/YsWKm8qfG+70Gn+fKhYg7e3tBABdXV3HKaXO8jwPREcWaMwMy7IgpXym++cMYzhULEDKhBCu7/sagM/MPaXHZ2aLiIrDnTbDqHiAoNQOEswsiEgc/o/MLAAIjID2kvH354gMaRjGISZADKMPJkAMow8mQAyjDyZADKMPJkAMow8mQAyjDyZADKMPJkAMow8mQAyjDyZADKMPJkAMow8jYbKiMQIkOSlmYAZtaJtEbQAaGndxGhsOrVBrBuIzZhDiwPS2SaWJo42NuhlgIhqzK9nGbIDEYrEB3Vsmk/GHOi0BisViPS0Ie4uGhgYelgVhzNSCtNjQNolSTU1+ilK6v4+ke/i7VHAujNEgGbMBMowZf6B4JKSJmamxrU1miPwEoADABuHBfTtOeH7flmlZpU93tTop6xUm+IInQLPNmtmWkgDurLEiXY4IbakSeGlypPa5pf6MV4koX+n7GipjMkA+9alPhdevX/+Prus6Ukpm5resJSEiVkqRZVlqxowZ9997771ZlNabDMVTkADwwoULJ+/YseNjSil1eHrKaWJmikajHU8//XRa634f6EclmUyKjc0ziIgUgkVod/3tuabX8vs/eEB5jQ++8fz7fEeEELKgmYBQCForgAkgoMAMIQg5YgjhgbTGpr1/U3+p3vt684ut32o+pfHelnRaJBKJMbUceqwFCAHgXC4XVUrdaVmWANDjUl7LsiCEABE9DmDIA2THjh3HA/gxEfWYnnI6tdY7lVIPBPX6d54mBsXaWmWqqclHCvjVtuen/rmw91PLXlp5hSdpug7byHsaqugCOdaUh6aDyT5skVopRcxggEGamBGWJ+gD+Rkg4g2trWNuUdtYCxAAQC6XYwC7fd+vR/lnfSsGQJZlFfRgP6p7QUSe67o+l7Zm6akE0cwsHMfZO1jXTDKLFJHOoMl/+KW/vudZ2rdsVdfOTxUjVl1Ra/h5V4tCXhOTEARCaUVn7z2bVP6jVKpIIk8VXa1kLxE/BozJAAlYRGShjwDBMN4/M1Mf6QEAHSw57rchPxDJ1lYrReQzs33D5ievXaF2fqMYdWrzXR6wP+8Tk5DlgHi72VuXlkpLzScAwMZdu8ZcQ30sB8jfK4q3tIhUU5N/95Znzv23l39/2/6wc27XARe0v+ATQ4LIGpQV/gRo34fH+gRBhHQ8Piyl8XAyA4VjCDMTOEnpREL958trv/RHvX91u1DndnXs84XSTCCr1wbQ27oghFd0wcDpf3zzzWNAxElOjqk8ZUqQMYKZiUCQBP2tF9p++FrI+0JHR5YlkxKlqt3gIxBpVirqRFv3bT4bzI/MACgYHRkTxlS0/70qBQfAYHndi6tatlfRFzr37fVlqbVztG0aDYZisF/6D4qZD/4/AB+l8RMGSp1ariWwW+UWgojTPQ4njl6mBBnlSsHRTIxm/NvGx+/vqHMuy+3r9AQJ+yhOoxmsmVmS4wg75EBICUEEeAoQAAkBDUCzhnZ9eMUiSLMiAMVcnnMsLn11376vnYBxnSh1SIyJBrsJkNGMmRrbmqVsSvnf3Bi7p6POuSy3t9MTRAMLDmbNECxCtnTCIeEUPAhXbbO1/pMDfqk6Et2360B2c9QJOY4tqwtufopmTPOZpxWFc4aqtkOeUihmc75XWzf5l+0vfOJfx59/W7K11UKppBn1TICMYsm2NplqSvmpF9pufLNaLs3t3Tew4GBmDWgZCcmoDCHsqk11rvz18dFx/3vltPdvIKKuvj4uAaTf3HTSxo435mWVXtIhQ/OLlqBtXbmvMPOdiXS6wGOkFDEBMkq1tLTIRFOTf+uLay/dFC5+vaNzny8HEBzMrCGEqKquktGC/+epbH3v2lDsATqRCgDwGQDxlhbZPmkSNTYCbW1taETjwc9vbNzFaUqoyyZP2wJgCwF33/vyupnrsx1fzk+ILml+qe3r6UTim82tyTFRipgAGYWSyaRIxOP6z2+83HBXxyt3dBR8LTX1O+DHGkpGQ7JGieyknPzWt3KNt9E55H0FQKy11Wo8NH1dAUAm+Fymh16pJCcF2hpFqq1NLzl55joAS7/3ypM/6fTUTctfWPPIVafNebI8kj+oNz/MTICMQhtnzCAi0i3rH78tW21PpP0FH/105WrWfri2zqr39PrTReiTnzp1znNJAC3MMgHoDJGfwcA7aEvT40tT5JPMYiPS9BU6P7N9+/b5a3LbL2ptbbUaATXaO3xNgIwyLS0tMpFIqNs3r23aIHKJ/IGufsc5mNmPjquzJhb5d9fJM6+oP6m+M8mtVoqa/ERQWrwT5VIi3tIijz322ByAB9/pOUcKMw4yymzYsIGZWb5S3H9zlv1+f0DWrEI11dbEHP/2xs7GS+tPqu9s4RaZoqZBbx+kEwnFzNTTaHoyOTpH2E0JMookW1utVFOTX73kQwtzVeGZ/oEOJYh6HwhkVnZNlRyf10/eeNqFi4jITzKLwSg1ehP0XB3svVq+fLk9depUsWDBgmIsFrMymYzC0CwrGBKjMqr/bjW2aQHC64XOL+XY4z5b5QzNjk01rm6PyQkJIvLiLS3D2mgulxr33HPPPyxYsOCCYEUlB8uhR8UUeVOCjBItLS0yQQm1fPOzZz/He5v8ri4IEr2WHkzgWjskjy1an1k4/azt5dJnONOcSqUYgD937txHlFK/nzNnziNz5879z5tuuqkzOETGYjFqbGzUwbEjrmQxJcgosWFSaSeRbe6+xX7IKi+d7RlD2dVRWZv3f/3V6Rc8XIngKKckHo+LJ554Yl99ff2/eJ73jVWrVv11/vz537jyyiuPB6AymYyfSqU0DgVHeU3MiMibpgQZDZipvPjpK+sfvdwt+CAc+T7Hg4cTi6qi8t5vT/gGGAQ0VmwsIp1Oq1gsZv32t7/9w+zZs3/puu7l+/btu6Gzs/Prs2fPfryqqmplVVXVU2edddarN9xwQ0fwQtcRwwTIKBBPp0UaUD98ae1pOUFTddHlnl54GvCd6mqrukv95or3zXwh3tIiU4mha5QPRENDAwOgSZMmfXf79u2LXNdVRFStlPqY67of27t3L954441ds2bNatdav6G1zkaj0Qcymcy98XhcDss2SL0YEcWY0bfpQfWqg/yLdXVIgtBrhtHMwlYKE8Lh28GgeHz40tmbIIPTgw8++LSUcp2U0iYiX2utPM/zfd9HsViclM1mZxQKhYuUUpcWCoXPERHS6XRF2yUmQEaBjY2ltd4HVPEDPqvSpgk9YWgZdoSVczf/a+fcNSAgQSNjG55YLCaIiKPRaFpKidLeFZBEZAWLHBmAZmbf8zzl+/4p//Ef/1EDQKOCPV4mQEaBNBJaEGG/Kr5H+QoovTv+CEys7VAI1Zazms4hL9baOigbQAyGxsZSO6iuru5xlILh8LQRSvnRAiC01g1tbW0nAEA8Hq9YPjUBMsIxM4HAT+7aVavAU7XnA308USUDYbbaAHSbg1t5QTcuFi1a9IIQYgcR9bXnlyYicl33PcOXwp6ZABnhmpubCQD+uvvlCRqoZdV7jYMZEgUXNcJ6ARhx2/AwAHHllVcWpJSbhBBAqfrU27HwPO94AGhvbzdVLKMXzc0AgA7K12nLcpg1emyEMLOQNmlfZcdF6Q0AmL5hw0gKEMRiMRG0PV4lIgSb6PWImcHMDcOXup6ZABnhZiBd2gNUOvXCsQHu9akLEMHRonBmzfQsADQ3N4+oACmrqqrKDuQ4Zh43xEnplwmQUaLoFe3+drTSYNiQdPIBMaJ/11wut3sg23MVCoWKDxqO6C/SADYgzgDQpb0O5brBrrg9IwCu0Lzn3cOz3/DbFYlEavuoXR1U3ny8ksxI+ijBvp9jcM9b1Xfjad/6y/adI/p3zefzNQM5LhwOV/y9IxWPUGNgTq19lwwJC70+eYkIygekqHmtc88UAEik0yPq981kMhoAtNZTmbnPWCciKKXahy1xvRhRX6DRg6AX670i3C607oIlAO51/EBRNCQO2PpU4NAUlRFEM7PFzNOCt070mf+IaPvwJKt3YzJAotEo0WBu0jwIBrpHlJTyLekOpoJjzrtP3SmY2qW0gF4H2JghBXKee847S+3gKy+euvzyy09USh0flIS95T8JAJFI5FXg4GTHihiTATJz5kwlpex3/YPWGnv27BnStMTjcQKAKVOm1FqW1VffPwfViqxlWW95u1SSk0IQ6SjZm6VtAdRzVy+ByHVd5H3vImamVGPjiJiHBQBtbW0CAO3bt28eSm3f3n4fBkBE1HXKKae8AqCiExbHZIB89atf7dJaH+g2Ce5wxMyQUoZqampqASCZTA5pmgqFQnUQG33+2ER0IKh+HCpJ2hoFA6iW1p+EZWnNrBmlDaZR2lBaBY0T6ecL7IbkWfe9su50RmlLniG7qaMQtD+4q6vrMq01+ijhWQgBy7I233rrre0ofQ8V65UbEV/eICo/ebWUsqPb3/VEA6D9+/c3AMDGjRuHpEpWnibhuu7kftLDQZ5pDwLpYHpmBLN5xyOyajxsEQqFnEg0KqO1NZZTW23JSEhqIYgZSjBcFXXkpnzHZ4mI29qaK/4bB9UrXrp06cla64uUUoxe8h4zayEE27b9JBHxQF6dPZQq/uUNAUFETETb+2mGaADo6uo6CRjy+T7ked4pffX9d+vV2QoAsVjsYHoSlNAA8MFTzn3i5Jx10bHKbpxcFAsndemrJxT0D8f5eLKWrUJ1Xa0U0XCoqyur9wtevC67612ZNuhKv9QmqF7xa6+9tkxrHULp9Qm9fd+CiCgcDv8OqGz7AxiD4yCxWIwymQwcx9nqeR64tItyj8cG833OBfDToUpPuWrh+/45QRD0PtBHhHA4/GpPSQWAaURFAKsO/0cB4HdvvHjin7p2X7hLyU92KswtHlc78Zev/eWLSKW+jsZWq7wL4nBLJpMilUqpT3/60+/561//+hnf9zX1vlURE5Egol2nnXbaHx5//HGk0+mKDnqOuQApsyxrfT/97EIpBd/3L2Rmm4i8IUgGAdBXXHHFxBdffHFmP12b5Yl864Hen5wt3CLTaSAeBza0TaI2tCHTmFIfolNfBXCHAO64bfOa87fuzn3NjYa/dstrz6avPeGcP1Vqn9yg9PA3bdr0faVUBKXSo7fqlbIsy4pEIg/edttt+4N9tCq6AfaYC5ByxqqtrV23f/9+oPe3xgpm1kqpkxYuXHg+gNXxeFwM5vrnWCwmM5mMv3PnzkVEVMfMPvW8TWj5yZk97rjjXgB677kprxA8/D1OyWRSoLFRpBob1TVETwL46E1bnl6Szx/45l3rn776tebmdjAThvGVBDNnzrQzmYz3kY985LNvvvnmR5VSqo/SAwiqx/X19T8BKl+9AsZgG6RcJJ911lkbieiNoErTc7coESulsHv37n8BwIPdDslkMszMIpvNXq2U6qt6pYkItm1vuOeee3bhbfTcpFIpnWpq8ksv0mQR5xb51ZPOu++91vivjHdCx6RSKT2cuS0Wi1nr1q3zFi1adPbu3btv8zxP9bHRBAAoIQSFQqE1Dz300NMABvVh9XaNuQBBsJwzlUrlQqHQGiEEo/fMJpVS2nXdj11++eXnZTIZPx6PD0qvSbB7oJo/f/4/KqXO1For9FKaMTMLISClfHQwem5SRDpNCdXCLTJx6pmvfmzamc8BBwcrCUO8xrtcNVq6dOnJr7/++q+KxWI4eDj0el1mhmVZdMwxx3yHmQ+OH1XaqAkQrQf+ACz3AIVCobQQgpi5r4YxK6XE9u3bf8TMMp1OA+8wA8XjcZnJZPxrrrlmQjabvcXzPN3PyL4kIkycOPFBYPCqFgkqbSZ92P0zShu6DUX3KZWD4+Mf//iMTZs2rfI8793M3Gu7Ayi1PaSU0rKsx371q189WumtfrqreIDoAc7MLhQKkYGeM9ggGaeffvoKKeWuoN7baymitVaFQuGs+fPn/1gIoQCIt7sbefnHZWbxl7/85RfFYnEKguWmvXxEBaXHut/85jd/wiBXLYIu73LJgeuvv/59N910U015QzcMTmlCwbk4k8n4l1566cItW7asLhQK79Za99fuKG1vIqXX0NBw7UCmwQ+nigeI4zh9/kBEREEQvV8IcTDz94NjsZh122237Q+Hw/cE28z0GolEJJVSfmdn52djsdj3iUilUikdi8WsgQZKcJyVTqfVI488ErrgggvS2Wz2or6qVkCpaiGlpHHjxv2EiHQsFhvK30Rs2bJlV2tr6/e6byYNQAYlylEFSzKZFN0D49Zbb62NxWLf3bZt24PFYrEepbZVnyUVMyvbtmU0Gr3xoYce2jCSSg+ggvsNlYvi+fPnL+vo6PiB53m99fCAmdlxHH/atGkzfv7zn7+cTCapPImvN0H/Oy9evPjdL7300kuu69oDqAcry7JkNBp98Iwzzvjyj370o1eCf6Jyu6B79afcqO++pX8ikTj79ddf/1E+nz93AL02GgA5jrOjqanptJtvvrn88swheYwG34lesGDBeXv27Flt2/YPp02b9oM777xza7fDZCwWo4aGBp4+fTqnUqnyZ7Fx40bq6Z43bdoUWrZs2eK9e/d+w3Xdk4OxjoG0dRQRyerq6mefeOKJOYlEQgWdLCOmGKl4gFx88cX/sGfPnnQ/AaKklDIcDt+5du3az0yfPt3ZuHGj2981yk+j888//wf5fH6Z7/u9XuPwazmO01lVVfXj44477mf33XffC31VBYUQWLRo0Rl79uz5fFdX12c9z7MHULUAM/uO41j19fXLVq5c+f+Go9+/fI25c+f+Z6FQuI6ZO6qqqn5ZU1Nz7zXXXPPUggULigM5DxHhk5/85Kl/+9vfFnZ1df2T1np6MDDb73cc0ACE4zh7TzrppJn333//a+UAfmd3OLgqFiDlzJtIJM7esmXLOtd1ua+GLDNr27bFhAkT4itXrnxg5syZ9iWXXKL6+UIFAHz605+e8Pzzz290Xbe++9/3cS0FQFqWBSGEb9v2M5ZlrbFte6Nt2280NDSgvb0dhULhXcx8RrFYnO153iwAwvd9UGlArr+qkgIgHcfZcP31189csGCBh6AB3c/n3pHg9cz0ta99bfyqVateKBQKkyzLAhFBSvmKbdtrQ6HQs5ZlvVhbW7vTdd2Orq4uPXHixNpisTg+m82ekM1mz9Baf0ApNYuZbd/3wcwq+P0GUkXUQa+Vmjhx4odXrlz5+5FWtSqrZFcaAeDly5dH77jjjpeLxeIxCJ4qvRzP5arWhAkTPvnYY4/dD5SeiA0NDdzbl1v+4hsbG5ccOHDg3mKx6Akh+n+XeOl6GoAUQkAIcXAFnJQSSqnyQdBalzsbyn39/X2vrLVW4XDYmjJlSuPDDz+cGc4M0r0UyWaz1ymliszsEBGV77VMKeUREQshnIOJf+s9+8E9D7TtpJkZjuOI+vr6K1auXPmLkTBi3ptKNtI5Ho/Lq666KmfbdpsQgvtqSKPUXifXdZ3du3f/Yt68ecuvvvrq4zOZjN9Xxkqn0yoej8vVq1ffF41Gf2Hbts3MA5lWQkQkiYiZWfm+73ue53uep/L5vPI8r7zxsh88PTmoUvX70ClXrSKRyA3DHRzAwW1A6dhjj72LiFQQHACgtdYH79PzPGZmW2vteJ4Hz/N0D/dsYeD5SDGzCILjEyM9OIAKvwarnDE++MEPfnj37t2/C0Zb++ufZ2ZmKaWwLGt/NBq9z3Gc337oQx9qu+6663LlYw77DAGg5cuXh++88862QqEwS2s90LryoGJmz7IsOxKJPLx27dqF8+bNq9R7+0gIwbNmzfpjoVCYVa5W9pTk8vHv5GLltonjOLm6urrFq1at+s1IDw6gwt28wVNTPProo48KIZ4VQkig9639A0REIhi7qMlms19wXffa8r/18hlOJpO46qqrcqeeeupHq6qqXpBSWgMsSQZNOTjC4fATF1988RVaa1Gpl1rGYjGptYZt2yuEEH2tdHynI++6PAkxHA5vPu644y4YLcEBjIBxkHg8TkTEkyZN+lK3Jan9ZhhmZtu2ybKs319++eULrrvuuiz6aOSmUikdj8flz372s51z5sy5KBQKPSOltJnZ7+0zg4iZ2Q+CY+XcuXMXpFKprmAVY0W6NMvd1eFw+OmgzTHYtQkOvlvhOI6MRqP3zpo16wO//vWv142W4ABGQICU2wi/+93v1tTV1X3Htm1La91npg26Yi3Lsp47//zz48uWLSuWV631d61kMiluvvnmHTNnzpxfW1v7gOM4VjAdYygChZnZZ2ZyHMeqqan56Y033rjg5ptvPlDpLs3p06czAFRXV2/uNpg5GPevg++Sgqnrr9bX1yfWrFnzidtvv31PeRrOIFxnWIyICWFAqT3ywAMPqHnz5v1XLpe7plgsctBd+pZ6cdA4lI7jbDnxxBNj6XR6+9E2csuZU0qJpqamL3R2dv677/t1vu8DpV6Zox5VPowOOhwsy7Jg2/aucePGffWxxx67q9t5Kz0YRgD4y1/+cv3q1as3e55Xj0NLlo9W+X4FEQkpJSzLaq+qqro9Fov9IJVK7UfpdxxRg4ADMWICBEFdl4h0Y2Pjv3Z2dt6gtXaC9cvl7lMGIEOh0K7x48ef/9hjj738DnqAynVrvXTp0hO3bt36f7u6upYCsJVS5akp5RFh0e0zhyv/4DqoHh7MJFLKQnV19d0nn3zyDXfcccc2jKxMQgC4tbXVuvbaazcrpaYiGJtB3+0ORtBREvy/RUQodw/btv1SNBq9+z3vec9dP/3pT98EDnXGDPUNDYWRFCBlAoC+5JJLzu7o6Ph2Pp9foJSC1hrMjEgkkj/xxBMvuv/++58cjLps9x9v0aJFp+/evfuzuVzuMmaeWu7vD5bmAocyd/dp44KIUM4kwYDba5FIJH388cffdc8997xw+HVGCEIpo8vZs2dv8H3/lO73Ws7/3dvu5XGg8n1S6RUGsCxrSygUWlVXV/e/3//+99umTZtWBA7e80h5ILwtIzFADmamYArHebt3716cy+UuFkIce/zxxy9taWl5aJAbeuXBPQUAyWSyes2aNbFcLneRUmq27/sna60nCiGgtUb5zyCDsJRyj2VZmx3HWRuJRB696KKLngg6DYCRVWocgZlpyZIl796zZ8/MfD5/TrFYPE0pdQIRNfi+H5ZSVhMRtNYuEeWJaC8RbbMs66VwOPx8NBr949VXX72h+xSV4LepSO/cYBuRAQIcbCcAwTR1ZpZXXXVVw3//93+/gaCUGYprbty4kbo/6YkIn//858e/+uqrx9i2PWXPnj3hiRMnjm9vb99TV1dXiEQib77//e9/49vf/nZH9/lasVjMamxs1CNtbtFACCFw9913V61YscKZOHFieaPp4vjx4/PNzc1d1PPadhmPxzHaS4xRp9uU6rLh6HmjeDwuj3K9BMViMevtTBuvtGQyKbrd70AWUolYLGZ1Ww4wqu73aIymG6tk7w8lk0kqby7X3t5O5XGEYEr4kE8yrAACgGQyScChl3AGxtq9GoZhGIZhGIZhGIZhGIZhGIZhGMMtyUkRa221Yq1JK9naaoGPHLxMJg8dE2tttdDLVqLxlhbZ/b+ejmFm6n69nrYlLR/T23XKaYpzi+wvTQNEAxjFlt22CxW9bR0a/L3VbVT/nabJKp8PPQ8sy/Ix6D39VB5572t2QvBvott9VHy90tjRS0avRFKG2NFmmrH4HQybir0fpPxCl2//9fGr9tTKC7ycG50iqp775ilzbiLABQHxlrRIJxLqxvWtH95dI5Yc2HegqqqmKmRlC9/57hkfeSrJSZGilE4mkyJFpG9+/g+XvRn2r7GYvKlFuoWIHisvjoq3tMh0IqF+sOGJBdui/uKubK762FDtazFuuOGCadN2MzOa0UwpSunbX1p32u5a7/9M2O9/959Pmfvn8nWAUimVTiTUdzZm/rmz2mrq3LvHqotWO++Xtf+29KRznmdm0ctkviO/gyBtixcvPn7Hjh3fllKuXbVq1Q/x1smYBIAbGxuvl1LKVatW/Z85c+YssyzrxNWrV38pmJpORMTLly+P/uIXv7g5l8s1OI5TGDdu3F0PPfTQ78vnGEiayjOpY7HYXN/3v6aU2svMIcdxItOnT//C8uXLt5fTTUSIxWL/XigUThZC1DDzq0899dQXup2OAOCuu+4K3XXXXdfu37//vKqqqrXLli37XiKR6L4fAF9yySXRzs7O5dFoNF0oFB6RUv7Q87w//uEPf7ijkksFKlaEBW8ewlZd+ICOhBfXkZy6r95JfWPj41eCiJOtbXL6pEkEANt0dhrXVS+d5ERr6kSYQ1Tez7cZLS0tMpVK6f968am528fTL13fndblFt63Ocor7tuy/txUKqWTzKJ8rpeLHccU66qWREmOa7fVsoe9rbcSwIl0WsxAMwGAYnVCcXz1kg7ypwLADMw4+BRuD87zN7fzHDdiXTbRjsKCzOeKqggAzc3NR/0dbN++/YpcLveJjo6OVDKZjOKtK/sIAIrF4oe6urq+sWTJklnZbHZWNpv9XA+ntIN3kczzfX/mzp07V1166aWNeBu7uTMzua6rXNf9RD6fv8h1XQ3gLfuJERG6uro+WywW5xYKhW2e53V238s4Ho8LIuI77rjjtkKhcEM4HK5m5htvueWW+4mI4/H4wWMPHDjg5PP5pUqp92YyGT+Xy30um81eCAz5+yP7VPE6nie5QHtz+y4bd0oyn89hv3Lfe/gxgilf2HfA97Xe4+bzu06sGrcdANDcjNuDDLtVdy0tFAv+rad+8L0frzltFsI2/Sn3xgcBAEFGBADP8wvckfUX10+/3s/lt7qsPyAApOMJvaGtrbQ5FNgtdBzwNUMludXat27fEd+TgDjgdxV9Bh1AobD17LrjtgHA9ddfP+Dp7ZlMRjEz5XK5xY7j/JmIatasWfNhlDbffkuGJqK9ruvi5Zdf/p9oNDqZmY94SekJJ5zgA/C11t97+umnpzPz/u3bt38KGHgmKz+pV69e/YdnnnnmUinlNsdx0k8//fTHli9f/hpQ2gCjfDwz75VSdkQiEXfy5MnbgvsXACidTqtvfetbTldX1z+FQqEfrl279kIhxCJmXtn9WgBQXV1Nnuft379//5LZs2ff4/t+Xko5tC+xH4CKB0gIsliotsfdk9/ycNjVb54ZnXIfAKC0uRkAQEoAzJTTqqogebwuyNDh52HNNjylLKLCnHHvLpJm7UIdUa2wpGCXmO7OvrwqEg5PmWpHkwpAPN0iyq9bBkprfyeHoh0pavKvOueqI7YHIoA0gE7l1rqEhrBlCQDQWg8oIwZPdL7iiiuma63f57puVCnlZLPZy4DS26m6H6+1rhNC/BmALhaLF0kpO3s5tXBdVwULu3xmdno5rj/UWurEEFrrSCwWs2bOnHnEjpTBhn8Rz/Mmu647rofdg4QQwmLmTgCYPHnyK7Ztbzj8IM/zyjvX1SilpnDp/e4VnzVc8QDxlF9nZwv0gXDtuZc5E0/73Mkz1wGltyQdPEbrUKg6KqNEW+2Q2PCCt70UIM3ANUGmPsaqTlfVjw/9ywuP//FLOx5vU8Riul3bBgAbdx3K+L5STlV1tTwlOv4f5qkJ7/3KKfP+BwDSicTBp5ljkaMtW27Odd701dee+PEtL66ZD5TaTQfPA45ajrRqpdhYG63Zta5j21QAaG5uHlCAlJ/oW7du/Twzo6qq6rlwOLzedd1//OIXvzgJh73skpknFYvFvaeddto/CSGglKrv4ZySiIRt25+YPXv2I0KI+oaGhp8Db+ulPHzhhRf6AMYxczSTyfjV1dVHnENrXS+EULZtvwgA69evd3Co/SSuv/76QjQafTCfz3/9vPPO+8m2bdv+orVuBg4+JAAAxWJRW5ZVO27cuOXPPPPMxbZtW77vH3GPw61iAdIQZOzj7Ojfxvv02MffdfYz844/Y1/3OuyMIGMfa9XssPLuqn3aPdvV+Jhl2Q0AsDE9gxKUUMlkUlx36vkrJrQXv6gItZYlneM6/U984dTz1ySTSZFOJFT5XFMiVe31Wf/ZucW6VYve+77X43yoOziOOAOArWiPvaertcMvAhZdqJU/CQBmpNPUEJznXU71Jkfjqd2+11Rg96MQ/jgAmDFjxoACJJPJqGBddzQUCv1Xa2vrxydOnHhFNBpt27lz54kAyq8hYwCIRCIrotHo83ffffczkUjk30Oh0JrDn9bMrEKh0P1Syi4Akdra2iUrVqx4GEF152h/I2ZGKBR6KBKJ/BE4MsiCPQJ+RUSvFwqFj3ieN6+qqkq89RCmM88888rq6uo7ieiCcDh858KFCy9jZur+imfHcTzbth8lom3xeFyGQqEHI5HIsz1d9+9K+dtMMovB6JYldOuM72FMpXwMcPClN+/oWoNooD2Ko7abt/um2MbR6CUjd0PgpEgyC3DvSzyD0oCAUnds7+caQKbhZOlajJ7fccggMFMpTe8oEwocium3xHcPx5VzWF+DaOXzyXc4UNjTdfu8Xh/Hle+r+5896f5vR7NjvGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYRuX8f7GAycBLtMBRAAAAAElFTkSuQmCC';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <img [src]="logoSrc" alt="LUO" style="height:80px;width:auto;margin-bottom:8px;object-fit:contain;"/>
        </div>
        <h2 class="login-title">Portfolio Progetti</h2>
        <p class="login-sub">Versione GitHub — inserisci le tue credenziali di accesso</p>

        @if (auth.error()) {
          <div class="login-err">{{ auth.error() }}</div>
        }

        <div class="fg">
          <label class="fl">Email</label>
          <input class="fi" type="email" [(ngModel)]="email" placeholder="nome@azienda.com" (keydown.enter)="login()"/>
        </div>
        <div class="fg">
          <label class="fl">GitHub Personal Access Token</label>
          <input class="fi" type="password" [(ngModel)]="token" placeholder="ghp_xxxxxxxxxxxx" (keydown.enter)="login()"/>
          <span class="fi-hint">Necessario per leggere e scrivere i dati nel repository</span>
        </div>
        <div class="fr2">
          <div class="fg">
            <label class="fl">GitHub Owner</label>
            <input class="fi" [(ngModel)]="owner" placeholder="nomeutente"/>
          </div>
          <div class="fg">
            <label class="fl">Repository</label>
            <input class="fi" [(ngModel)]="repo" placeholder="luo-portfolio-access"/>
          </div>
        </div>

        <button class="btn btn-p" [disabled]="auth.isLoading()" (click)="login()">
          @if (auth.isLoading()) {
            <span class="spinner-sm"></span> Connessione...
          } @else {
            Accedi
          }
        </button>

        <div class="login-info">
          <strong>Come ottenere il token GitHub:</strong><br/>
          GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → seleziona scope <strong>repo</strong> → Generate.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--black); }
    .login-card { background: white; border-radius: 14px; padding: 40px; width: 440px; box-shadow: 0 30px 80px rgba(0,0,0,.4); }
    .login-logo { text-align: center; margin-bottom: 20px; }
    .login-title { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
    .login-sub { font-size: 12px; color: var(--gray-400); margin-bottom: 20px; }
    .login-err { background: #fcebeb; color: #a32d2d; font-size: 12px; padding: 10px 12px; border-radius: 6px; margin-bottom: 14px; }
    .fi-hint { font-size: 11px; color: var(--gray-400); margin-top: 3px; display: block; }
    .fr2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .btn { width: 100%; justify-content: center; margin-top: 4px; display: flex; align-items: center; gap: 8px; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,.2); border-top-color: var(--black); border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .login-info { margin-top: 20px; font-size: 11px; color: var(--gray-400); background: var(--gray-50); padding: 12px; border-radius: 6px; line-height: 1.6; }
  `]
})
export class LoginComponent {
  logoSrc = LOGO_B64;
  auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  token = '';
  owner = '';
  repo = 'luo-portfolio-access';

  async login(): Promise<void> {
    if (!this.email || !this.token || !this.owner || !this.repo) return;
    const ok = await this.auth.login(this.email, this.token, this.owner, this.repo);
    if (ok) this.router.navigate(['/dashboard']);
  }
}
